"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { EnvelopeSimple, CheckCircle, PaperPlaneRight } from "@phosphor-icons/react";
import { RevealHeading } from "./RevealHeading";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Label, Input, FieldError } from "@/components/ui/Input";

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
      const subject = encodeURIComponent(`UpScaler inquiry from ${form.name}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nEmail: ${form.email}\nInstitution: ${form.institution || "n/a"}\n\n${form.message}`
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
    <section ref={ref} id="contact" className="bg-white ui-section border-t border-line">
      <div className="ui-container">
        <div className="grid lg:grid-cols-2 gap-14 items-start max-w-5xl mx-auto">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <RevealHeading className="text-heading-l mb-4">
              Let&apos;s talk about your <span className="ui-mark">institution</span>
            </RevealHeading>
            <p className="text-body text-ink-muted mb-8 max-w-md">
              Whether you&apos;re evaluating UpScaler for your HR team, faculty, or student body,
              request a demo and our team will walk you through the platform directly.
            </p>

            <div className="flex flex-col gap-4">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-3 text-sm text-ink-muted hover:text-ink transition-colors duration-200 group w-fit"
              >
                <span className="w-9 h-9 rounded-lg bg-paper-tint border border-line flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <EnvelopeSimple className="size-4" />
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
          >
            {/* Double-bezel: outer shell (tray) + inner core (form), concentric radii */}
            <div className="rounded-[1.75rem] bg-ink/[0.04] ring-1 ring-ink/5 p-2">
              <Card className="p-6 lg:p-8 rounded-[calc(1.75rem-0.5rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                {status === "success" ? (
                  <div className="text-center py-6" role="status">
                    <div className="w-12 h-12 rounded-full bg-[color-mix(in_srgb,var(--color-success)_12%,white)] text-primary flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="size-6" weight="fill" />
                    </div>
                    <h3 className="font-bold text-ink text-lg mb-2">Your email client should be opening</h3>
                    <p className="text-ink-muted text-sm mb-6">
                      If nothing happened, email us directly at{" "}
                      <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-semibold hover:underline">
                        {CONTACT_EMAIL}
                      </a>
                      .
                    </p>
                    <Button type="button" variant="secondary" shape="pill" onClick={() => setStatus("idle")}>
                      Send another message
                    </Button>
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
                      <Field>
                        <Label htmlFor="contact-name" required>
                          Full name
                        </Label>
                        <Input
                          id="contact-name"
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          error={errors.name}
                          aria-describedby={errors.name ? "contact-name-error" : undefined}
                          placeholder="Jane Doe"
                        />
                        {errors.name && <FieldError><span id="contact-name-error">{errors.name}</span></FieldError>}
                      </Field>

                      <Field>
                        <Label htmlFor="contact-email" required>
                          Email
                        </Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          error={errors.email}
                          aria-describedby={errors.email ? "contact-email-error" : undefined}
                          placeholder="jane@college.edu"
                        />
                        {errors.email && <FieldError><span id="contact-email-error">{errors.email}</span></FieldError>}
                      </Field>

                      <Field>
                        <Label htmlFor="contact-institution">
                          Institution / Company <span className="text-ink-faint font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="contact-institution"
                          type="text"
                          value={form.institution}
                          onChange={(e) => setForm({ ...form, institution: e.target.value })}
                          placeholder="e.g. Nirmala College for Women"
                        />
                      </Field>

                      <Field>
                        <Label htmlFor="contact-message" required>
                          Message
                        </Label>
                        <textarea
                          id="contact-message"
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          aria-invalid={!!errors.message}
                          aria-describedby={errors.message ? "contact-message-error" : undefined}
                          rows={4}
                          className="h-auto w-full rounded-md border bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:cursor-not-allowed disabled:opacity-60 border-line focus:border-primary"
                          placeholder="Tell us about your institution or what you'd like to know..."
                        />
                        {errors.message && <FieldError><span id="contact-message-error">{errors.message}</span></FieldError>}
                      </Field>

                      {status === "error" && (
                        <p className="text-danger text-sm" role="alert">
                          Something went wrong. Please try again or email us directly.
                        </p>
                      )}

                      <Button type="submit" shape="pill" className="w-full justify-center" loading={status === "submitting"}>
                        {status === "submitting" ? (
                          "Sending..."
                        ) : (
                          <>
                            Send Message
                            <PaperPlaneRight className="size-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
