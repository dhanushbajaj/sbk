# Uncover Bricks Ottawa

Real estate website for Ottawa & surrounding communities, built with Next.js (App Router, TypeScript).

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

## Pages

| Route | What it is |
|---|---|
| `/` | Active listings grouped by locality (Ottawa Central, Kanata, Stittsville, Barrhaven, Nepean, Orleans, Gloucester, Manotick, Greely, Findlay Creek, Riverside South, Rockland, Carp) with price/beds/type filters and sorting |
| `/property/[id]` | Listing detail with photo gallery and CREA-required brokerage attribution |
| `/pre-construction` | Lead-capture form (name, email, phone) with validation + honeypot spam protection |
| `/about` | Agency intro with Instagram link ([@uncoverbricksottawa](https://instagram.com/uncoverbricksottawa)) |

## Placeholders that need real credentials

Copy `.env.example` to `.env.local` and fill in values as you obtain them. Until then the site runs fully in **demo mode** (yellow banner, mock listings).

### 1. CREA DDF (live MLS® listings)
- Apply for DDF access at [crea.ca/ddf](https://www.crea.ca/ddf/) — requires CREA membership and an approved data feed agreement.
- Set `DDF_CLIENT_ID`, `DDF_CLIENT_SECRET`, and flip `DDF_USE_LIVE=true`.
- The live client ([lib/ddf.ts](lib/ddf.ts)) is already written: OAuth 2.0 client-credentials token against `identity.crea.ca`, OData `Property` queries with `$filter` + `$expand=Media`, paging, hourly revalidation, and automatic fallback to mock data on error. Credentials never reach the browser — all calls are server-side.
- Mock data ([lib/mock-listings.ts](lib/mock-listings.ts)) is shaped exactly like RESO Property responses, so no UI changes are needed when going live.

### 2. Lead email notifications
- Leads are **always** saved to `data/leads.json` (created on first submission), so nothing is lost without credentials.
- To also receive an email per lead: create a [Resend](https://resend.com) account, then set `RESEND_API_KEY`, `LEAD_NOTIFY_EMAIL`, `LEAD_FROM_EMAIL`.

### 3. Content placeholders (no credentials, just your info)
- [app/about/page.tsx](app/about/page.tsx) — agent name, bio, photo (`/public/agent.jpg`), phone, email, brokerage.
- [app/layout.tsx](app/layout.tsx) — footer brokerage name & office address.
- [app/pre-construction/page.tsx](app/pre-construction/page.tsx) — intro copy if you want your own wording.
- Listing photos in mock mode come from picsum.photos (needs internet to display).
- Optional Instagram feed embed on the About page (Behold / LightWidget / Meta oEmbed — the last needs a Facebook developer token).

## Compliance notes

- Every listing card and detail page shows the listing brokerage (`ListOfficeName`).
- The footer carries the standard CREA REALTOR®/MLS® trademark disclaimers.
- Live DDF data is fetched server-side and cached (hourly revalidation) per DDF's replication-oriented design.
