import type { Metadata } from "next";
import { getListings, isMockMode } from "@/lib/ddf";
import { toSummary } from "@/lib/types";
import ListingsBrowser from "../components/ListingsBrowser";

export const revalidate = 3600; // re-fetch listings at most hourly

export const metadata: Metadata = {
  title: "Properties for Sale",
  description:
    "Browse active MLS® listings across Ottawa, Kanata, Barrhaven, Orleans, Stittsville, Manotick and surrounding communities, grouped by locality.",
};

export default async function PropertiesPage() {
  const listings = (await getListings()).map(toSummary);
  const mock = isMockMode();

  return (
    <>
      {mock && (
        <div className="demo-banner">
          Demo mode — showing placeholder listings. Add your CREA DDF credentials in
          .env.local and set DDF_USE_LIVE=true to display live MLS® data.
        </div>
      )}
      <section className="hero">
        <div className="container">
          <h1>Homes for Sale in Ottawa &amp; Surrounding Communities</h1>
          <p>
            Browse active listings across Ottawa, Kanata, Barrhaven, Orleans, Stittsville,
            Manotick and more — curated by Uncover Bricks Ottawa.
          </p>
        </div>
      </section>
      <section className="section-pad">
        <div className="container">
          <ListingsBrowser listings={listings} />
        </div>
      </section>
    </>
  );
}
