import { SUPPORT_EMAIL } from "@/components/landing/campus/troubleshootingGuides";
import type { Doc } from "./types";

const MAIL = `[${SUPPORT_EMAIL}](mailto:${SUPPORT_EMAIL})`;

// Applies to the paid Pro plan bought online by independent learners and recruiters.
// Institutions are billed under their own agreement (see the Terms, "Plans and Payments").
export const refund: Doc = {
  slug: "refund-policy",
  title: "Refund and Cancellation Policy",
  group: "Legal",
  updated: "13 November 2026",
  audiences: ["individuals", "recruiters"],
  intro:
    "This policy explains what you get when you buy a paid TalentSnaps plan online, how cancellation works, and when we refund a payment. It applies to independent learners and recruiters who pay on the Subscription screen. Institutions are billed under their own agreement.",
  sections: [
    {
      id: "summary",
      title: "In Short",
      blocks: [
        {
          note: "Paid plans are one-time payments. They don't renew by themselves, so there's nothing to cancel and you're never charged again unless you buy again. We refund payments taken in error. We don't refund a plan you've bought and started using because you changed your mind.",
        },
      ],
    },
    {
      id: "what-you-buy",
      title: "What You're Buying",
      blocks: [
        {
          p: "A paid plan gives you the extra features of TalentSnaps Pro for a fixed period, either 6 or 12 months. The price shown at checkout is the full amount charged, in Indian rupees (INR). The plan switches on as soon as your payment is confirmed, so you can use it straight away.",
        },
        {
          p: "If you buy again before your plan ends, the new period is added after the end of your current one, so you don't lose any time.",
        },
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation",
      blocks: [
        {
          p: "Because a paid plan doesn't renew automatically, you don't need to cancel it. It simply ends at the end of the period you paid for, and your account goes back to the free plan. Your profile, results and other data stay in your account.",
        },
        {
          p: "If you want to close your account before your plan ends, see our [Terms and Conditions](terms-and-conditions) and [Privacy Policy](privacy-policy). Closing an account doesn't by itself entitle you to a refund of the unused period.",
        },
      ],
    },
    {
      id: "refunds",
      title: "When We Refund",
      subsections: [
        {
          id: "eligible",
          title: "Payments we refund",
          blocks: [
            {
              ul: [
                "**Charged twice**: you were charged more than once for the same purchase. We refund the extra payment.",
                "**Charged but not activated**: your payment went through but your plan didn't switch on, and we can't fix it within a reasonable time.",
                "**Wrong amount**: you were charged an amount different from the one shown at checkout.",
                "**Where the law requires it**: any refund you're entitled to under applicable consumer law.",
              ],
            },
          ],
        },
        {
          id: "not-eligible",
          title: "Payments we don't refund",
          blocks: [
            {
              ul: [
                "A change of mind after your plan has been activated.",
                "Unused time left on a plan, including when you close your account or stop using TalentSnaps.",
                "Loss of access because your account was suspended or closed for breaking our [Terms and Conditions](terms-and-conditions).",
              ],
            },
          ],
        },
      ],
    },
    {
      id: "failed-payments",
      title: "If a Payment Fails",
      blocks: [
        {
          p: "Sometimes the money leaves your account but the payment doesn't complete, for example if your connection drops. In that case your bank or our payment provider normally returns the amount automatically, usually within 5 to 7 working days. You don't need to pay again to get it back.",
        },
        {
          p: `If the money hasn't returned after 7 working days, or your plan isn't active after a payment, email ${MAIL} with the payment ID and we'll look into it. You'll find the payment ID in the confirmation from your bank, UPI app or Razorpay.`,
        },
      ],
    },
    {
      id: "how-to-ask",
      title: "How to Ask for a Refund",
      blocks: [
        {
          p: `Email ${MAIL} from the address on your TalentSnaps account and tell us:`,
        },
        {
          ul: [
            "the date and amount of the payment,",
            "the payment ID or order ID, if you have it,",
            "what went wrong.",
          ],
        },
        {
          p: "Please write as soon as you notice the problem. We'll reply within 5 working days and tell you whether the refund is approved.",
        },
      ],
    },
    {
      id: "how-paid",
      title: "How Refunds Are Paid",
      blocks: [
        {
          p: "Approved refunds go back to the payment method you used, whether that's a card, UPI or net banking. We can't send a refund to a different account or method. After we approve a refund, your bank usually takes 5 to 7 working days to show it. Some banks take longer.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      blocks: [
        {
          p: "We may update this policy. The version on this page applies to payments made after its \"Last updated\" date.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          p: `Questions about a payment or this policy: ${MAIL}.`,
        },
      ],
    },
  ],
};
