"use client";

import { useState } from "react";

type FieldErrors = { name?: string; email?: string; phone?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Canadian phone: optional +1 / 1, then 10 digits, common separators allowed
const PHONE_RE = /^(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

export default function LeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
        body: JSON.stringify({ name, email, phone, website }),
      });
      setStatus(res.ok ? "done" : "failed");
    } catch {
      setStatus("failed");
    }
  }

  if (status === "done") {
    return (
      <div className="form-success" role="status">
        <strong>Thanks, {name.split(" ")[0]}!</strong> You&apos;re on the list. We&apos;ll be in
        touch with pre-construction opportunities that match your interests.
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ marginTop: 0 }}>Register for early access</h2>

      {status === "failed" && (
        <div className="form-error-banner" role="alert">
          Something went wrong sending your registration. Please try again.
        </div>
      )}

      <div className="form-field">
        <label htmlFor="lead-name">Full name</label>
        <input
          id="lead-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="lead-email">Email</label>
        <input
          id="lead-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="lead-phone">Phone</label>
        <input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="613-555-0123"
          required
        />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>

      {/* Honeypot — real users never see or fill this */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="lead-website">Website</label>
        <input
          id="lead-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Get early access"}
      </button>
    </form>
  );
}
