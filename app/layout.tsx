import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Uncover Bricks Ottawa | Real Estate in Ottawa & Surrounding Areas",
    template: "%s | Uncover Bricks Ottawa",
  },
  description:
    "Browse active MLS® listings across Ottawa, Kanata, Barrhaven, Orleans, Stittsville and more. Pre-construction opportunities and local expertise from Uncover Bricks Ottawa.",
  keywords: [
    "Ottawa real estate",
    "homes for sale Ottawa",
    "Kanata homes",
    "Barrhaven homes",
    "pre-construction Ottawa",
  ],
};

const NAV_LINKS = [
  { href: "/", label: "Properties" },
  { href: "/pre-construction", label: "Pre-Construction" },
  { href: "/about", label: "About" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark">UB</span>
              <span className="brand-text">
                Uncover Bricks <em>Ottawa</em>
              </span>
            </Link>
            <nav className="site-nav" aria-label="Main navigation">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="container footer-inner">
            <div>
              <p className="footer-brand">Uncover Bricks Ottawa</p>
              <p>
                Follow us on Instagram:{" "}
                <a
                  href="https://instagram.com/uncoverbricksottawa"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @uncoverbricksottawa
                </a>
              </p>
              {/* PLACEHOLDER: replace with your brokerage's registered name & address */}
              <p className="footer-muted">[Your Brokerage Name], Brokerage — [Office Address, Ottawa, ON]</p>
            </div>
            <div className="footer-legal">
              <p>
                The trademarks REALTOR®, REALTORS® and the REALTOR® logo are controlled by The
                Canadian Real Estate Association (CREA) and identify real estate professionals who
                are members of CREA. The trademarks MLS®, Multiple Listing Service® and the
                associated logos identify professional services rendered by REALTOR® members of
                CREA to effect the purchase, sale and lease of real estate as part of a cooperative
                selling system.
              </p>
              <p>
                Listing data is provided under copyright by the Canadian Real Estate Association
                and is deemed reliable but is not guaranteed accurate.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
