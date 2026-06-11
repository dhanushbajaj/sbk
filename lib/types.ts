// Shapes follow the RESO Web API "Property" resource as served by
// CREA's DDF (https://ddfapi-docs.realtor.ca/). Only the fields this
// site displays are modelled.

export interface DdfMedia {
  MediaKey: string;
  MediaURL: string;
  Order: number;
  LongDescription?: string;
}

export interface DdfProperty {
  ListingKey: string;
  ListingId: string; // MLS® number
  StandardStatus: "Active" | "Pending" | "Closed";
  UnparsedAddress: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  SubdivisionName?: string; // neighbourhood, when the board provides it
  Latitude: number;
  Longitude: number;
  ListPrice: number;
  PropertyType: string; // e.g. "Residential"
  PropertySubType: string; // e.g. "Single Family Residence", "Condo"
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number; // square feet
  LotSizeArea?: number;
  YearBuilt?: number;
  PublicRemarks: string;
  ListOfficeName: string; // listing brokerage — must be displayed (CREA rule)
  ModificationTimestamp: string;
  ListingContractDate: string;
  Media: DdfMedia[];
}

/**
 * Localities shown in the locality selector. Some are cities in the
 * DDF data (Rockland), some are former municipalities or neighbourhoods
 * that appear under City="Ottawa" with a SubdivisionName.
 */
export const LOCALITIES = [
  "Ottawa (Central)",
  "Kanata",
  "Stittsville",
  "Barrhaven",
  "Nepean",
  "Orleans",
  "Gloucester",
  "Manotick",
  "Greely",
  "Findlay Creek",
  "Riverside South",
  "Rockland",
  "Carp",
] as const;

export type Locality = (typeof LOCALITIES)[number];

/**
 * Slim listing card data sent to the browser. The full DdfProperty set
 * (all photos + remarks) is ~40MB for the Ottawa area — cards only need
 * this subset; detail pages load the full record server-side.
 */
export interface ListingSummary {
  key: string;
  id: string; // MLS® number
  price: number;
  address: string;
  city: string;
  locality: Locality;
  beds: number;
  baths: number;
  sqft: number;
  type: string;
  office: string;
  photo: string | null;
  listed: string; // ISO date, drives "newest" sort
}

export function toSummary(p: DdfProperty): ListingSummary {
  return {
    key: p.ListingKey,
    id: p.ListingId,
    price: p.ListPrice,
    address: p.UnparsedAddress,
    city: p.City,
    locality: localityOf(p),
    beds: p.BedroomsTotal,
    baths: p.BathroomsTotalInteger,
    sqft: p.LivingArea,
    type: p.PropertySubType,
    office: p.ListOfficeName,
    photo: p.Media[0]?.MediaURL ?? null,
    listed: p.ListingContractDate,
  };
}

/** Derive the display locality for a listing from its DDF fields. */
export function localityOf(p: DdfProperty): Locality {
  const sub = (p.SubdivisionName ?? "").toLowerCase();
  const city = (p.City ?? "").toLowerCase();

  for (const loc of LOCALITIES) {
    const needle = loc.toLowerCase();
    if (needle === "ottawa (central)") continue;
    if (city === needle || sub.includes(needle)) return loc;
  }
  return "Ottawa (Central)";
}
