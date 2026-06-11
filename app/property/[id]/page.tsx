import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListing, getListings } from "@/lib/ddf";
import { localityOf } from "@/lib/types";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Live feed has thousands of listings — prerender a handful at build
  // time and render the rest on demand (cached for an hour).
  const listings = await getListings();
  return listings.slice(0, 24).map((l) => ({ id: l.ListingKey }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.UnparsedAddress}, ${listing.City} — MLS® ${listing.ListingId}`,
    description: listing.PublicRemarks.slice(0, 155),
  };
}

function fmtPrice(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const [main, ...rest] = [...listing.Media].sort((a, b) => a.Order - b.Order);

  return (
    <div className="container">
      <Link href="/" className="back-link">
        ← Back to all listings
      </Link>

      <div className="detail-head">
        <div>
          <h1>
            {listing.UnparsedAddress}, {listing.City}, {listing.StateOrProvince}{" "}
            {listing.PostalCode}
          </h1>
          <p className="listing-locality">
            {localityOf(listing)} · MLS® Number: {listing.ListingId} · {listing.StandardStatus}
          </p>
        </div>
        <div className="detail-price">{fmtPrice(listing.ListPrice)}</div>
      </div>

      {main && (
        <div className="gallery">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="main-photo" src={main.MediaURL} alt={listing.UnparsedAddress} />
          {rest.slice(0, 2).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.MediaKey} src={m.MediaURL} alt="" loading="lazy" />
          ))}
        </div>
      )}
      {rest.length > 2 && (
        <div className="gallery-rest">
          {rest.slice(2).map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={m.MediaKey} src={m.MediaURL} alt="" loading="lazy" />
          ))}
        </div>
      )}

      <div className="facts">
        {listing.BedroomsTotal > 0 && (
          <div className="fact">
            <strong>{listing.BedroomsTotal}</strong> Bedrooms
          </div>
        )}
        {listing.BathroomsTotalInteger > 0 && (
          <div className="fact">
            <strong>{listing.BathroomsTotalInteger}</strong> Bathrooms
          </div>
        )}
        {listing.LivingArea > 0 && (
          <div className="fact">
            <strong>{listing.LivingArea.toLocaleString()}</strong> Sq ft
          </div>
        )}
        <div className="fact">
          <strong>{listing.PropertySubType}</strong> Type
        </div>
        {listing.YearBuilt && (
          <div className="fact">
            <strong>{listing.YearBuilt}</strong> Year built
          </div>
        )}
        {listing.LotSizeArea && (
          <div className="fact">
            <strong>{listing.LotSizeArea}</strong> Acres (lot)
          </div>
        )}
      </div>

      <div className="remarks">
        <h2>About this property</h2>
        <p>{listing.PublicRemarks}</p>
      </div>

      {/* CREA display rules: brokerage attribution must accompany every listing */}
      <div className="attribution">
        {listing.ListOfficeName && (
          <>
            Listing courtesy of <strong>{listing.ListOfficeName}</strong>.{" "}
          </>
        )}
        Data provided by the
        Canadian Real Estate Association's Data Distribution Facility (DDF®). MLS®, REALTOR® and
        associated logos are trademarks of CREA. Information is deemed reliable but not guaranteed.
      </div>
    </div>
  );
}
