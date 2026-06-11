import type { DdfMedia, DdfProperty } from "./types";
import { MOCK_LISTINGS } from "./mock-listings";

// =================================================================
// CREA DDF client (https://ddfapi-docs.realtor.ca/)
//
// Notes from probing the live API (it differs from generic RESO):
//  - $expand/$select/$orderby/$count are NOT supported; only
//    $filter + $top (max 100) with @odata.nextLink paging.
//  - Media is embedded inline on each Property record.
//  - StateOrProvince is an enum: 'Ontario', not 'ON'.
//  - There is no ListOfficeName field — brokerage names must be
//    resolved from the Office resource via ListOfficeKey.
//  - Neighbourhood lives in CityRegion ("2605 - Findlay Creek"-style
//    OREB district names); suburbs like Kanata/Orleans/Rockland are
//    their own City values, the rest fall under City='Ottawa'.
//  - Rentals have no ListPrice (lease fields instead) — skipped.
// =================================================================

const DDF_TOKEN_URL = "https://identity.crea.ca/connect/token";
const DDF_API_BASE = "https://ddfapi.realtor.ca/odata/v1";

/** City values that exist in the feed for our coverage area. */
const AREA_CITIES = ["Ottawa", "Kanata", "Orleans", "Rockland"];

const PAGE_SIZE = 100;
const MAX_PAGES = 60; // safety cap: 6,000 listings per sync

function liveConfigured(): boolean {
  const { DDF_USE_LIVE, DDF_CLIENT_ID, DDF_CLIENT_SECRET } = process.env;
  return (
    DDF_USE_LIVE === "true" &&
    !!DDF_CLIENT_ID &&
    !DDF_CLIENT_ID.startsWith("YOUR_") &&
    !!DDF_CLIENT_SECRET &&
    !DDF_CLIENT_SECRET.startsWith("YOUR_")
  );
}

// --- OAuth 2.0 client-credentials token, cached until near expiry ---
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }
  const res = await fetch(DDF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.DDF_CLIENT_ID!,
      client_secret: process.env.DDF_CLIENT_SECRET!,
      scope: "DDFApi_Read",
    }),
    // No cache option: explicit no-store would force routes dynamic and
    // break static prerendering; the module-level token cache handles reuse.
  });
  if (!res.ok) {
    throw new Error(`DDF token request failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function ddfGet<T>(url: string): Promise<T> {
  const token = await getAccessToken();
  // Plain fetch — pages exceed Next's 2MB data-cache limit, so caching
  // happens at the listings level (module TTL cache + ISR revalidation).
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`DDF request failed (${res.status} ${res.statusText}): ${url}`);
  }
  return (await res.json()) as T;
}

/** Raw Property record as the live feed actually returns it. */
interface RawProperty {
  ListingKey: string;
  ListingId: string;
  StandardStatus: string;
  UnparsedAddress: string | null;
  City: string;
  StateOrProvince: string;
  PostalCode: string | null;
  CityRegion: string | null;
  Latitude: number | null;
  Longitude: number | null;
  ListPrice: number | null;
  PropertySubType: string | null;
  BedroomsTotal: number | null;
  BathroomsTotalInteger: number | null;
  LivingArea: number | null;
  LotSizeArea: number | null;
  YearBuilt: number | null;
  PublicRemarks: string | null;
  ListOfficeKey: string | null;
  ModificationTimestamp: string;
  OriginalEntryTimestamp: string;
  Media: Array<{
    MediaKey: string;
    MediaURL: string;
    Order: number;
    MediaCategory: string | null;
    LongDescription: string | null;
  }> | null;
}

interface ODataPage<T> {
  value: T[];
  "@odata.nextLink"?: string;
}

async function fetchRawListings(): Promise<RawProperty[]> {
  const cityFilter = AREA_CITIES.map((c) => `City eq '${c}'`).join(" or ");
  const filter = `StandardStatus eq 'Active' and StateOrProvince eq 'Ontario' and (${cityFilter})`;

  const rows: RawProperty[] = [];
  let url: string | null =
    `${DDF_API_BASE}/Property?$filter=${encodeURIComponent(filter)}&$top=${PAGE_SIZE}`;

  for (let page = 0; url && page < MAX_PAGES; page++) {
    const data: ODataPage<RawProperty> = await ddfGet(url);
    rows.push(...data.value);
    url = data["@odata.nextLink"] ?? null;
  }
  return rows;
}

// --- Brokerage names: resolve ListOfficeKey -> OfficeName (cached) ---
const officeNameCache = new Map<string, string>();

interface RawOffice {
  OfficeKey: string;
  OfficeName: string;
}

async function resolveOfficeNames(keys: string[]): Promise<Map<string, string>> {
  const missing = [...new Set(keys)].filter((k) => k && !officeNameCache.has(k));
  const BATCH = 20;
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    // 'in' syntax — long 'or' chains are rejected by the DDF API
    const filter = `OfficeKey in (${batch.map((k) => `'${k}'`).join(",")})`;
    try {
      const data: ODataPage<RawOffice> = await ddfGet(
        `${DDF_API_BASE}/Office?$filter=${encodeURIComponent(filter)}&$top=${BATCH}`,
      );
      for (const o of data.value) officeNameCache.set(o.OfficeKey, o.OfficeName);
    } catch (err) {
      console.error("Office lookup failed for a batch:", err);
    }
  }
  return officeNameCache;
}

/** "2605 - Blossom Park/Kemp Park/Findlay Creek" -> "Blossom Park/Kemp Park/Findlay Creek" */
function cleanRegion(region: string | null): string | undefined {
  if (!region) return undefined;
  return region.replace(/^\d+\s*-\s*/, "").trim() || undefined;
}

function normalize(raw: RawProperty, officeNames: Map<string, string>): DdfProperty {
  const media: DdfMedia[] = (raw.Media ?? [])
    .filter((m) => !m.MediaCategory || m.MediaCategory === "Property Photo")
    .sort((a, b) => a.Order - b.Order)
    .map((m) => ({
      MediaKey: m.MediaKey,
      MediaURL: m.MediaURL,
      Order: m.Order,
      LongDescription: m.LongDescription ?? undefined,
    }));

  return {
    ListingKey: raw.ListingKey,
    ListingId: raw.ListingId,
    StandardStatus: "Active",
    UnparsedAddress: raw.UnparsedAddress ?? "",
    City: raw.City ?? "Ottawa",
    StateOrProvince: "ON",
    PostalCode: raw.PostalCode ?? "",
    SubdivisionName: cleanRegion(raw.CityRegion),
    Latitude: raw.Latitude ?? 0,
    Longitude: raw.Longitude ?? 0,
    ListPrice: raw.ListPrice ?? 0,
    PropertyType: "Residential",
    PropertySubType: raw.PropertySubType ?? "Property",
    BedroomsTotal: raw.BedroomsTotal ?? 0,
    BathroomsTotalInteger: raw.BathroomsTotalInteger ?? 0,
    LivingArea: raw.LivingArea ?? 0,
    LotSizeArea: raw.LotSizeArea ?? undefined,
    YearBuilt: raw.YearBuilt ?? undefined,
    PublicRemarks: raw.PublicRemarks ?? "",
    ListOfficeName: (raw.ListOfficeKey && officeNames.get(raw.ListOfficeKey)) || "",
    ModificationTimestamp: raw.ModificationTimestamp,
    // Live feed has no ListingContractDate; entry timestamp drives "newest"
    ListingContractDate: raw.OriginalEntryTimestamp,
    Media: media,
  };
}

async function fetchLiveListings(): Promise<DdfProperty[]> {
  const raw = await fetchRawListings();
  // For-sale listings only: rentals/leases carry no ListPrice
  const forSale = raw.filter((r) => r.ListPrice && r.ListPrice > 0);
  const officeNames = await resolveOfficeNames(
    forSale.map((r) => r.ListOfficeKey).filter((k): k is string => !!k),
  );
  return forSale.map((r) => normalize(r, officeNames));
}

// Avoid refetching the whole feed on every request between revalidations.
let listingsCache: { data: DdfProperty[]; fetchedAt: number } | null = null;
const LISTINGS_TTL_MS = 60 * 60 * 1000;

/** All active for-sale listings in the Ottawa area (mock until live is configured). */
export async function getListings(): Promise<DdfProperty[]> {
  if (liveConfigured()) {
    if (listingsCache && Date.now() - listingsCache.fetchedAt < LISTINGS_TTL_MS) {
      return listingsCache.data;
    }
    try {
      const data = await fetchLiveListings();
      listingsCache = { data, fetchedAt: Date.now() };
      return data;
    } catch (err) {
      console.error("DDF live fetch failed, falling back:", err);
      if (listingsCache) return listingsCache.data; // serve stale over nothing
      return MOCK_LISTINGS;
    }
  }
  return MOCK_LISTINGS;
}

/** A single listing by ListingKey. */
export async function getListing(key: string): Promise<DdfProperty | undefined> {
  const all = await getListings();
  return all.find((p) => p.ListingKey === key);
}

/** True when the site is serving placeholder data (used for the demo banner). */
export function isMockMode(): boolean {
  return !liveConfigured();
}
