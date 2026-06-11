import type { Metadata } from "next";
import LeadForm from "../components/LeadForm";

export const metadata: Metadata = {
  title: "Pre-Construction Opportunities",
  description:
    "Get early access to pre-construction homes and condos in Ottawa. Register with Uncover Bricks Ottawa for floor plans, pricing, and VIP previews.",
};

export default function PreConstructionPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Pre-Construction in Ottawa</h1>
          <p>
            Be first in line for new builds across Ottawa and its fastest-growing suburbs.
          </p>
        </div>
      </section>
      <section className="section-pad">
        <div className="container about-grid">
          <div>
            <h2>Why buy pre-construction?</h2>
            {/* PLACEHOLDER COPY — replace with your own pitch */}
            <p>
              Ottawa&apos;s newest communities — from Riverside South and Findlay Creek to Kanata
              and Orleans — are launching pre-construction homes and condos with extended deposit
              schedules, builder incentives, and the chance to choose your finishes from day one.
              Buying early often means today&apos;s pricing in tomorrow&apos;s neighbourhood.
            </p>
            <p>
              Register below and we&apos;ll send you floor plans, price lists, and VIP launch
              invitations before they hit the open market. No spam — just opportunities that match
              what you&apos;re looking for.
            </p>
          </div>
          <LeadForm />
        </div>
      </section>
    </>
  );
}
