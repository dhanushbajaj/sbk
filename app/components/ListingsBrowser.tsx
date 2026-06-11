"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LOCALITIES, type ListingSummary, type Locality } from "@/lib/types";

type SortKey = "newest" | "price-asc" | "price-desc";

const GROUP_PREVIEW = 6; // cards per locality in the "All areas" view
const PAGE = 24; // cards per "Show more" click in a single-locality view

const PRICE_BANDS = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under $500k", min: 0, max: 500_000 },
  { label: "$500k – $750k", min: 500_000, max: 750_000 },
  { label: "$750k – $1M", min: 750_000, max: 1_000_000 },
  { label: "Over $1M", min: 1_000_000, max: Infinity },
];

function fmtPrice(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

export default function ListingsBrowser({ listings }: { listings: ListingSummary[] }) {
  const [locality, setLocality] = useState<Locality | "All">("All");
  const [priceBand, setPriceBand] = useState(0);
  const [minBeds, setMinBeds] = useState(0);
  const [propType, setPropType] = useState("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    setVisible(PAGE);
  }, [locality, priceBand, minBeds, propType, sort]);

  const propTypes = useMemo(
    () => Array.from(new Set(listings.map((l) => l.type))).sort(),
    [listings],
  );

  const countByLocality = useMemo(() => {
    const counts = new Map<Locality, number>();
    for (const l of listings) counts.set(l.locality, (counts.get(l.locality) ?? 0) + 1);
    return counts;
  }, [listings]);

  const filtered = useMemo(() => {
    const band = PRICE_BANDS[priceBand];
    const out = listings.filter((l) => {
      if (locality !== "All" && l.locality !== locality) return false;
      if (l.price < band.min || l.price >= band.max) return false;
      if (l.beds < minBeds) return false;
      if (propType !== "All" && l.type !== propType) return false;
      return true;
    });
    out.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return +new Date(b.listed) - +new Date(a.listed);
    });
    return out;
  }, [listings, locality, priceBand, minBeds, propType, sort]);

  // "All areas": preview a few per locality with a link to the full list.
  const grouped = useMemo(() => {
    if (locality !== "All") return null;
    const groups = new Map<Locality, ListingSummary[]>();
    for (const loc of LOCALITIES) groups.set(loc, []);
    for (const l of filtered) groups.get(l.locality)!.push(l);
    return [...groups.entries()].filter(([, ls]) => ls.length > 0);
  }, [filtered, locality]);

  return (
    <>
      <div className="filters">
        <div className="filter-field">
          <label htmlFor="f-price">Price</label>
          <select
            id="f-price"
            value={priceBand}
            onChange={(e) => setPriceBand(Number(e.target.value))}
          >
            {PRICE_BANDS.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="f-beds">Bedrooms</label>
          <select id="f-beds" value={minBeds} onChange={(e) => setMinBeds(Number(e.target.value))}>
            <option value={0}>Any</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5+</option>
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="f-type">Property type</label>
          <select id="f-type" value={propType} onChange={(e) => setPropType(e.target.value)}>
            <option value="All">All types</option>
            {propTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="f-sort">Sort by</label>
          <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="locality-bar" role="tablist" aria-label="Filter by locality">
        <button
          className={`locality-chip ${locality === "All" ? "active" : ""}`}
          onClick={() => setLocality("All")}
        >
          All areas<span className="chip-count">{listings.length.toLocaleString()}</span>
        </button>
        {LOCALITIES.map((loc) => {
          const n = countByLocality.get(loc) ?? 0;
          if (n === 0) return null;
          return (
            <button
              key={loc}
              className={`locality-chip ${locality === loc ? "active" : ""}`}
              onClick={() => setLocality(loc)}
            >
              {loc}
              <span className="chip-count">{n.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          No listings match those filters. Try widening the price range or bedroom count.
        </div>
      )}

      {grouped ? (
        grouped.map(([loc, ls]) => (
          <div className="locality-group" key={loc}>
            <h2>{loc}</h2>
            <ListingGrid listings={ls.slice(0, GROUP_PREVIEW)} />
            {ls.length > GROUP_PREVIEW && (
              <p>
                <button className="locality-chip" onClick={() => setLocality(loc)}>
                  View all {ls.length.toLocaleString()} in {loc} →
                </button>
              </p>
            )}
          </div>
        ))
      ) : (
        filtered.length > 0 && (
          <div className="locality-group">
            <h2>
              {locality}{" "}
              <span className="chip-count">{filtered.length.toLocaleString()} listings</span>
            </h2>
            <ListingGrid listings={filtered.slice(0, visible)} />
            {filtered.length > visible && (
              <p style={{ textAlign: "center", marginTop: 24 }}>
                <button className="btn" onClick={() => setVisible((v) => v + PAGE)}>
                  Show more ({(filtered.length - visible).toLocaleString()} remaining)
                </button>
              </p>
            )}
          </div>
        )
      )}
    </>
  );
}

function ListingGrid({ listings }: { listings: ListingSummary[] }) {
  return (
    <div className="listing-grid">
      {listings.map((l) => (
        <Link href={`/property/${l.key}`} className="listing-card" key={l.key}>
          <div className="listing-photo">
            {l.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photo} alt={l.address} loading="lazy" />
            )}
            <span className="badge">{l.type}</span>
          </div>
          <div className="listing-body">
            <div className="listing-price">{fmtPrice(l.price)}</div>
            <p className="listing-address">
              {l.address}, {l.city}
            </p>
            <p className="listing-locality">
              {l.locality} · MLS® {l.id}
            </p>
            <div className="listing-meta">
              {l.beds > 0 && <span>🛏 {l.beds} bd</span>}
              {l.baths > 0 && <span>🛁 {l.baths} ba</span>}
              {l.sqft > 0 && <span>📐 {l.sqft.toLocaleString()} sq ft</span>}
            </div>
            {l.office && <div className="listing-broker">Listed by {l.office}</div>}
          </div>
        </Link>
      ))}
    </div>
  );
}
