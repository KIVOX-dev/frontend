"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { RevealHeading } from "./RevealHeading";

type FormState = {
  name: string;
  email: string;
  institution: string;
  message: string;
  // Honeypot — real visitors never see or fill this field. Any submission
  // with it populated is silently treated as spam (fake success, no send).
  website: string;
};

type Status = "idle" | "submitting" | "success" | "error";

const initialForm: FormState = { name: "", email: "", institution: "", message: "", website: "" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// No contact-inquiry backend endpoint exists yet (checked both python-service
// and node-api) — this opens the visitor's own email client via mailto: as an
// honest, functional fallback rather than faking a "sent" state with nowhere
// for the message to actually go. Swap CONTACT_EMAIL for the real support
// inbox, and replace the mailto: call with a real POST once a /contact
// endpoint exists.
const CONTACT_EMAIL = "hello@upscaler-ai.com";

export default function ContactSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>("idle");

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!form.email.trim()) next.email = "Please enter your email.";
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!form.message.trim()) next.message = "Please add a short message.";
    else if (form.message.trim().length < 10) next.message = "Message should be at least 10 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot tripped — pretend it worked, send nothing.
    if (form.website.trim()) {
      setStatus("success");
      return;
    }

    if (!validate()) return;

    setStatus("submitting");
    try {
      const subject = encodeURIComponent(`UpScaler AI inquiry from ${form.name}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nInstitution: ${form.institution || "—"}\n\n${form.message}`
      );
      // Brief, deliberate pause so the loading state is perceptible rather
      // than an instant flicker — the actual "send" below is synchronous.
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section ref={ref} id="contact" className="bg-white ui-section border-t border-scale-line">
      <div className="ui-container">
        <div className="grid lg:grid-cols-2 gap-14 items-start max-w-5xl mx-auto">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="scale-eyebrow mb-5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              </svg>
              Get In Touch
            </div>
            <RevealHeading className="ui-section-title mb-4">
              Let&apos;s talk <span className="scale-mark">placements</span>
            </RevealHeading>
            <p className="ui-lede mb-8 max-w-md">
              Whether you&apos;re an institution exploring UpScaler AI for your placement cell or a
              recruiter with questions — send us a message and our team will follow up directly.
            </p>

            <div className="flex flex-col gap-4">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-3 text-sm text-scale-ink-muted hover:text-scale-ink transition-colors duration-200 group w-fit"
              >
                <span className="w-9 h-9 rounded-lg bg-scale-50 border border-scale-line flex items-center justify-center shrink-0 group-hover:bg-scale-900 group-hover:border-scale-900 group-hover:text-scale-500 transition-all duration-300 ease-expo">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
                {CONTACT_EMAIL}
              </a>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="scale-card p-6 lg:p-8"
          >
            {status === "success" ? (
              <div className="text-center py-6" role="status">
                <div className="w-12 h-12 rounded-full bg-scale-100 border border-scale-300/50 text-scale-900 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
                    <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <h3 className="font-bold text-scale-ink text-lg mb-2">Your email client should be opening</h3>
                <p className="text-scale-ink-muted text-sm mb-6">
                  If nothing happened, email us directly at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-scale-600 font-semibold hover:underline">
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
                <button type="button" onClick={() => setStatus("idle")} className="scale-btn-secondary !px-4 !py-2 !text-[13px]">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Honeypot — visually hidden, kept out of the tab order, never seen by real users */}
                <div className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold text-scale-ink mb-1.5">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "contact-name-error" : undefined}
                      className="w-full px-4 py-2.5 rounded-xl border border-scale-300/60 bg-white text-scale-ink text-sm focus:outline-none focus:border-scale-500 focus:ring-2 focus:ring-scale-100 transition-all duration-200"
                      placeholder="Jane Doe"
                    />
                    {errors.name && (
                      <p id="contact-name-error" className="text-red-500 text-xs mt-1.5" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-semibold text-scale-ink mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                      className="w-full px-4 py-2.5 rounded-xl border border-scale-300/60 bg-white text-scale-ink text-sm focus:outline-none focus:border-scale-500 focus:ring-2 focus:ring-scale-100 transition-all duration-200"
                      placeholder="jane@college.edu"
                    />
                    {errors.email && (
                      <p id="contact-email-error" className="text-red-500 text-xs mt-1.5" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contact-institution" className="block text-sm font-semibold text-scale-ink mb-1.5">
                      Institution / Company <span className="text-scale-ink-faint font-normal">(optional)</span>
                    </label>
                    <input
                      id="contact-institution"
                      type="text"
                      value={form.institution}
                      onChange={(e) => setForm({ ...form, institution: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-scale-300/60 bg-white text-scale-ink text-sm focus:outline-none focus:border-scale-500 focus:ring-2 focus:ring-scale-100 transition-all duration-200"
                      placeholder="e.g. Nirmala College for Women"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-semibold text-scale-ink mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "contact-message-error" : undefined}
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-scale-300/60 bg-white text-scale-ink text-sm focus:outline-none focus:border-scale-500 focus:ring-2 focus:ring-scale-100 transition-all duration-200 resize-none"
                      placeholder="Tell us about your institution or what you'd like to know..."
                    />
                    {errors.message && (
                      <p id="contact-message-error" className="text-red-500 text-xs mt-1.5" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>

                  {status === "error" && (
                    <p className="text-red-500 text-sm" role="alert">
                      Something went wrong. Please try again or email us directly.
                    </p>
                  )}

                  <button type="submit" className="scale-btn-primary w-full justify-center" disabled={status === "submitting"}>
                    {status === "submitting" ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
