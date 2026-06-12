"use client";

import { useState } from "react";

type FieldErrors = { name?: string; email?: string; phone?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

export default function InquiryForm({
  listingId,
  address,
}: {
  listingId: string;
  address: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `Hi, I'd like more information about ${address} (MLS® ${listingId}).`,
  );
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "failed">("idle");

  function validate(): boolean {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = "Please enter your full name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Please enter a valid email address.";
    if (!PHONE_RE.test(phone.trim()))
      next.phone = "Please enter a valid Canadian phone number, e.g. 613-555-0123.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          website,
          source: "listing-inquiry",
          listingId,
          address,
        }),
      });
      setStatus(res.ok ? "done" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "done") {
    return (
      <div className="form-success" role="status">
        <strong>Thanks, {name.split(" ")[0]}!</strong> Your inquiry about MLS® {listingId} is on
        its way — we&apos;ll get back to you shortly.
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ marginTop: 0 }}>Ask about this property</h2>

      {status === "failed" && (
        <div className="form-error-banner" role="alert">
          Something went wrong sending your inquiry. Please try again, or call us at{" "}
          <a href="tel:+16137953906">613-795-3906</a>.
        </div>
      )}

      <div className="form-field">
        <label htmlFor="inq-name">Full name</label>
        <input
          id="inq-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="inq-email">Email</label>
        <input
          id="inq-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="inq-phone">Phone</label>
        <input
          id="inq-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="613-555-0123"
          required
        />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="inq-message">Message</label>
        <textarea
          id="inq-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {/* Honeypot — real users never see or fill this */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="inq-website">Website</label>
        <input
          id="inq-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
