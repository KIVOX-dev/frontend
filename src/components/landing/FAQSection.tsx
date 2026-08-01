"use client";

import { useRef, useState, useId } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { RevealHeading } from "./RevealHeading";

const faqs = [
  {
    q: "What exactly is UpScaler AI, and who is it for?",
    a: "UpScaler AI is an AI-powered aptitude training and campus placement platform. It's built for three audiences at once — students preparing for placements, faculty and institution admins running placement cells, and recruiters sourcing pre-verified campus talent.",
  },
  {
    q: "How does the free trial work?",
    a: "Every new account gets 14 days of full platform access — no credit card required. That includes adaptive AI tests, the resume analyzer, mock interviews, and (for institutions) batch analytics dashboards. You can cancel anytime during the trial with no charge.",
  },
  {
    q: "Do you support both individual students and entire institutions?",
    a: "Yes. Students can sign up directly for personal aptitude training. Institutions get a dedicated admin console to onboard departments and batches in bulk, assign tests, and track cohort-wide performance in real time.",
  },
  {
    q: "How is our data secured?",
    a: "Access is role-based (student, faculty, admin, recruiter), sessions are managed securely, and data is encrypted in transit. Institutional data is isolated per account — no cross-institution visibility.",
  },
  {
    q: "Can our existing faculty and student records be migrated?",
    a: "Yes — the admin console supports bulk import via spreadsheet upload for student rosters and faculty accounts, so institutions are typically fully onboarded in under a day.",
  },
  {
    q: "What if we need help getting set up?",
    a: "Our team supports every institutional onboarding directly, and platform support is available to all accounts. Use the contact section below to reach us and we'll get back to you promptly.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="shrink-0 text-scale-ink-faint"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
  inView,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  inView: boolean;
}) {
  const id = useId();
  const buttonId = `faq-button-${id}`;
  const panelId = `faq-panel-${id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotateX: -20 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 800 }}
      className="scale-card overflow-hidden"
    >
      <h3 className="m-0">
        <button
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 group"
        >
          <span className="font-semibold text-scale-ink text-[15px] lg:text-base group-hover:text-scale-900 transition-colors duration-200">
            {question}
          </span>
          <ChevronIcon open={isOpen} />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-scale-ink-muted text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section ref={ref} id="faq" className="bg-scale-50 ui-section border-t border-scale-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="scale-eyebrow mb-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2 1.75-2 3.5M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Frequently Asked Questions
          </div>
          <RevealHeading className="ui-section-title mb-4">
            Questions? <span className="scale-mark">We&apos;ve got answers</span>
          </RevealHeading>
          <p className="ui-lede">
            Can&apos;t find what you&apos;re looking for? Reach out to our team below.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {faqs.map((item, i) => (
            <FAQItem
              key={item.q}
              question={item.q}
              answer={item.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              index={i}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
