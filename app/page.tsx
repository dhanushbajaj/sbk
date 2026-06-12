import Link from "next/link";
import { getListings } from "@/lib/ddf";
import { toSummary } from "@/lib/types";

export const revalidate = 3600;

const SERVICES = [
  {
    icon: "🏠",
    title: "Buying a Home",
    text: "From first showing to final keys: curated listings, neighbourhood guidance, offer strategy, and negotiation that protects your budget.",
  },
  {
    icon: "📈",
    title: "Selling Your Property",
    text: "Data-driven pricing, professional staging and photography advice, and MLS® exposure that gets your home in front of serious buyers.",
  },
  {
    icon: "🏗",
    title: "Pre-Construction & New Builds",
    text: "Early access to builder launches across Ottawa's growing communities — floor plans, incentives, and deposit structures explained plainly.",
  },
  {
    icon: "💼",
    title: "Investment Properties",
    text: "Cash-flow analysis, rental market insight, and duplex/multi-unit opportunities in Ottawa's strongest rental neighbourhoods.",
  },
  {
    icon: "🧮",
    title: "Free Home Valuation",
    text: "Thinking of selling? Get an honest, no-obligation assessment of what your home is worth in today's market.",
  },
  {
    icon: "🧭",
    title: "First-Time Buyer Guidance",
    text: "Incentives, pre-approval, closing costs, and what to actually look for at a viewing — everything a first purchase needs.",
  },
];

function fmtPrice(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

export default async function HomePage() {
  const featured = (await getListings())
    .map(toSummary)
    .filter((l) => l.photo)
    .sort((a, b) => +new Date(b.listed) - +new Date(a.listed))
    .slice(0, 6);

  return (
    <>
      <section className="landing-hero">
        <div className="container">
          <h1>
            Uncover your next home, <em>brick by brick</em>.
          </h1>
          <p>
            Uncover Bricks Ottawa helps buyers, sellers, and investors across Ottawa, Kanata,
            Barrhaven, Orleans, Stittsville, and beyond — with live MLS® listings, local
            knowledge, and straight answers.
          </p>
          <div className="hero-actions">
            <Link className="btn-solid" href="/properties">
              Browse listings
            </Link>
            <Link className="btn-outline" href="/pre-construction">
              Pre-construction access
            </Link>
          </div>
        </div>
        <span className="photo-credit">
          Photo:{" "}
          <a href="https://www.flickr.com/people/dneuman/" target="_blank" rel="noopener noreferrer">
            dneuman
          </a>{" "}
          / Wikimedia Commons, CC BY-SA 2.0
        </span>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="accent-bar" />
          <h2 className="section-head">Ottawa real estate, done properly</h2>
          <p className="section-sub">
            The capital&apos;s market moves fast — new LRT lines, growing suburbs, and
            pre-construction communities are reshaping where and how people live. Whether
            you&apos;re hunting for a Centretown condo, a family home in Kanata, or an income
            duplex in Sandy Hill, we combine live MLS® data with on-the-ground knowledge of
            every neighbourhood we serve.
          </p>
          <div className="services-grid">
            {SERVICES.map((s) => (
              <div className="service-card" key={s.title}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>

          <div className="cta-band">
            <div>
              <h2>Not sure where to start?</h2>
              <p>
                Call or email Shreya for a no-pressure conversation about your goals —
                buying, selling, or just curious about the market.
              </p>
            </div>
            <div className="hero-actions">
              <a className="btn-solid" href="tel:+16137953906">
                613-795-3906
              </a>
              <a className="btn-outline" href="mailto:ottawarealtorsbk@gmail.com">
                Email us
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="accent-bar" />
          <h2 className="section-head">Newest listings</h2>
          <p className="section-sub">
            Fresh on the market across Ottawa and area — updated from the MLS® throughout the
            day.
          </p>
          <div className="listing-grid">
            {featured.map((l) => (
              <Link href={`/property/${l.key}`} className="listing-card" key={l.key}>
                <div className="listing-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.photo!} alt={l.address} loading="lazy" />
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
                  {l.office && <div className="listing-broker">Listed by {l.office}</div>}
                </div>
              </Link>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 28 }}>
            <Link className="btn-solid" href="/properties">
              See all listings →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
