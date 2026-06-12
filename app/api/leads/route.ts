import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json");

export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; website?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: bots fill the hidden "website" field. Pretend success.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();

  if (name.length < 2 || !EMAIL_RE.test(email) || !PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const lead = {
    name,
    email,
    phone,
    source: "pre-construction",
    receivedAt: new Date().toISOString(),
  };

  // Two delivery channels; succeed if at least one works.
  // 1) Local JSON file — works in local/self-hosted deployments. On
  //    serverless hosts (Vercel) the filesystem is read-only, so this
  //    is expected to fail there and email becomes the durable channel.
  let savedToFile = false;
  try {
    await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true });
    let leads: unknown[] = [];
    try {
      leads = JSON.parse(await fs.readFile(LEADS_FILE, "utf8"));
    } catch {
      // first lead — file doesn't exist yet
    }
    leads.push(lead);
    await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
    savedToFile = true;
  } catch (err) {
    console.warn("Lead file write failed (read-only filesystem?):", err);
  }

  // 2) Email notification — runs once RESEND_API_KEY is a real key.
  let emailed = false;
  try {
    emailed = await sendLeadEmail(lead);
  } catch (err) {
    console.error("Lead email failed:", err);
  }

  if (!savedToFile && !emailed) {
    // No durable destination — surface the failure instead of silently
    // dropping the lead. (Always logged so it appears in host logs.)
    console.error("LEAD NOT PERSISTED — configure Resend env vars:", lead);
    return NextResponse.json({ error: "Could not record lead" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Returns true only if a notification email was actually sent. */
async function sendLeadEmail(lead: {
  name: string;
  email: string;
  phone: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;

  if (!apiKey || apiKey.startsWith("YOUR_") || !to || !from) {
    console.log(
      "[placeholder] Email sending skipped — set RESEND_API_KEY, LEAD_NOTIFY_EMAIL and " +
        "LEAD_FROM_EMAIL to receive lead notifications. New lead:",
      lead,
    );
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New pre-construction lead: ${lead.name}`,
      text: `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\nSource: Pre-Construction form`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend API returned ${res.status}`);
  }
  return true;
}
