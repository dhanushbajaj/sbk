import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Uncover Bricks Ottawa helps buyers and sellers across Ottawa, Kanata, Barrhaven, Orleans and beyond. Follow @uncoverbricksottawa on Instagram.",
};

export default function AboutPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>About Uncover Bricks Ottawa</h1>
          <p>Local knowledge, honest advice, and a brick-by-brick view of Ottawa real estate.</p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container about-grid">
          <div>
            {/* PLACEHOLDER COPY — replace with your real story */}
            <h2>Who we are</h2>
            <p>
              Uncover Bricks Ottawa is a real estate agency serving Ottawa and its surrounding
              communities — from Centretown condos to family homes in Kanata, Barrhaven, Orleans,
              Stittsville, Manotick, and beyond. We believe finding the right home starts with
              understanding the neighbourhood, and nobody walks those streets more than we do.
            </p>
            <p>
              Whether you&apos;re buying your first condo, upsizing for a growing family, or
              exploring pre-construction opportunities, we bring market data, negotiation
              experience, and straight answers to every conversation.
            </p>

            <h2>Find us on Instagram</h2>
            <p>
              We share new listings, neighbourhood tours, market updates, and behind-the-scenes
              looks at Ottawa real estate every week.
            </p>
            <a
              className="insta-card"
              href="https://instagram.com/uncoverbricksottawa"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="insta-icon">IG</span>
              <span>
                <strong>@uncoverbricksottawa</strong>
                <br />
                Follow us on Instagram
              </span>
            </a>
          </div>

          <div>
            <h2>Your agent</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="agent-photo" src="/agent.jpg" alt="Shreya Bajaj" />
            <h3>Shreya Bajaj, REALTOR®</h3>
            <p>
              <strong>Phone:</strong> <a href="tel:+16137953906">613-795-3906</a>
              <br />
              <strong>Email:</strong>{" "}
              <a href="mailto:ottawarealtorsbk@gmail.com">ottawarealtorsbk@gmail.com</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
