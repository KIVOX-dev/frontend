"use client";

import { useRef, useState, useId } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";
import { RevealHeading } from "./RevealHeading";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

const faqs = [
  {
    q: "How does implementation work?",
    a: "A dedicated onboarding specialist configures your departments and roles during a guided setup, then bulk-imports existing student records via CSV. Most institutions are fully live within a few weeks, not a full semester.",
  },
  {
    q: "Can multiple departments use it?",
    a: "Yes, the platform is built for institution-wide use from day one. Each department gets its own scoped view of students, faculty, and reports, while administrators retain a unified, cross-department view.",
  },
  {
    q: "Does it support mobile?",
    a: "Every role, HR, students, faculty, and administrators, gets a fully responsive experience that works on phones and tablets, so practice tests, results, and placement approvals can happen from anywhere on campus.",
  },
  {
    q: "How is data secured?",
    a: "Access is role-based (HR, student, faculty, admin), sessions are managed securely, and data is encrypted in transit. Each institution's data is isolated; there is no cross-institution visibility.",
  },
  {
    q: "Can our existing student records be migrated?",
    a: "Yes, the admin console supports bulk CSV import for student rosters, so institutions are typically fully onboarded in under a day.",
  },
  {
    q: "What if we need help after go-live?",
    a: "Our team supports every institutional rollout directly, and platform support is available to all accounts afterward. Use the contact section below to reach us and we'll get back to you promptly.",
  },
];

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
    >
      <Card className="p-0 overflow-hidden" interactive>
        <h3 className="m-0">
          <button
            id={buttonId}
            type="button"
            aria-expanded={isOpen}
            aria-controls={panelId}
            onClick={onToggle}
            className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 group"
          >
            <span className="font-semibold text-ink text-[15px] lg:text-base group-hover:text-primary transition-colors duration-200">
              {question}
            </span>
            <CaretDown
              className={`shrink-0 size-[18px] text-ink-faint transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? "rotate-180" : ""}`}
            />
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
              <p className="px-6 pb-5 text-ink-muted text-sm leading-relaxed">{answer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function FAQSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section ref={ref} id="faq" className="bg-[var(--color-bg-secondary)] ui-section border-t border-line">
      <div className="ui-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <Badge tone="success" className="mb-5">
            Frequently Asked Questions
          </Badge>
          <RevealHeading className="text-heading-l mb-4">
            Questions? <span className="ui-mark">We&apos;ve got answers</span>
          </RevealHeading>
          <p className="text-body text-ink-muted">
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
