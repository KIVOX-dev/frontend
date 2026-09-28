"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { Turnstile, isTurnstileConfigured, type TurnstileHandle } from "@/components/auth/Turnstile";

// Values must match node-api's contact.validation.js PRODUCTS.
const PRODUCTS = [
  { value: "campus_placements", label: "Campus placements (placement cell)" },
  { value: "recruiter_hiring", label: "Hiring from campus (recruiters)" },
  { value: "student_assessments", label: "Student assessments & skill reports" },
  { value: "other", label: "Something else" },
];

const EMPTY = { name: "", organization: "", email: "", phone: "", product: "", message: "" };

// Flat, square-cornered fields: the landing site's own editorial style.
const inputClass =
  "mt-2 block w-full rounded-[4px] border border-[#D5DDDD] bg-white px-3.5 py-3 text-[15px] font-normal text-[#06262B] placeholder:text-[#9AA8A9] outline-none transition-colors focus:border-[#0563F9] focus:ring-2 focus:ring-[#0563F9]/15";
const labelClass = "block text-[15px] font-medium text-[#06262B]";

export function TalkToSalesForm({ inbox }: { inbox: string }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isTurnstileConfigured && !turnstileToken) {
      setError("Please complete the verification check.");
      return;
    }
    setSending(true);
    try {
      await api.post("/contact/sales", { ...form, turnstileToken });
      setSent(true);
    } catch (err) {
      setError(extractErrorMessage(err, `Couldn't send your request. Please email ${inbox}.`));
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-[4px] border border-[#D5DDDD] bg-[#F5F9F9] p-6 sm:p-8" role="status">
        <p className="text-[22px] font-semibold text-[#06262B]">Thanks, {form.name.split(" ")[0]}.</p>
        <p className="mt-2 text-[16px] text-[#44585A]">
          Your request is with our team. We&apos;ll reach you at <strong>{form.email}</strong> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="grid gap-5">
        <label className={labelClass}>
          Name <span className="text-[#C2410C]">*</span>
          <input className={inputClass} value={form.name} onChange={set("name")} required minLength={2} maxLength={120} autoComplete="name" />
        </label>
        <label className={labelClass}>
          Organization <span className="text-[#C2410C]">*</span>
          <input className={inputClass} value={form.organization} onChange={set("organization")} required minLength={2} maxLength={160} autoComplete="organization" placeholder="College or company" />
        </label>
        <label className={labelClass}>
          Work email <span className="text-[#C2410C]">*</span>
          <input className={inputClass} type="email" value={form.email} onChange={set("email")} required maxLength={255} autoComplete="email" />
        </label>
        <label className={labelClass}>
          Phone number <span className="text-[#C2410C]">*</span>
          <input className={inputClass} type="tel" value={form.phone} onChange={set("phone")} required pattern="[+0-9 ()\-]{7,20}" autoComplete="tel" placeholder="+91" />
        </label>
        <label className={labelClass}>
          What are you exploring? <span className="text-[#C2410C]">*</span>
          <select className={inputClass} value={form.product} onChange={set("product")} required>
            <option value="" disabled>
              Select…
            </option>
            {PRODUCTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Anything you&apos;d like us to know <span className="font-normal text-[#6E7E7F]">(optional)</span>
          <textarea className={`${inputClass} min-h-[110px] resize-y`} value={form.message} onChange={set("message")} maxLength={2000} placeholder="Batch size, drives per year, timelines…" />
        </label>
      </div>

      {error && (
        <p className="mt-5 rounded-[4px] border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[14px] text-[#B91C1C]" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5">
        <Turnstile ref={turnstileRef} action="talk_to_sales" onVerify={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[4px] bg-[#0563F9] px-5 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-[#0450CC] disabled:opacity-60"
      >
        {sending ? "Sending…" : "Book my call"}
        {!sending && (
          <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden="true">
            <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <p className="mt-3 text-center text-[13px] text-[#6E7E7F]">No spam. You&apos;ll hear from us within 24 hours.</p>
    </form>
  );
}
