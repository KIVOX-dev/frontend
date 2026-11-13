"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { planStatus, formatPlanDate } from "@/lib/plan";
import { PlanChip } from "@/components/shared/PlanBadge";
import { loadRazorpay, type RazorpayFailure, type RazorpaySuccess } from "@/lib/razorpay";

type Plan = { id: string; label: string; months: number; amount: number };

/* Shown until /payments/plans answers. The server's amounts are the ones charged. */
const FALLBACK_PLANS: Plan[] = [
  { id: "pro_6m", label: "Pro, 6 months", months: 6, amount: 11900 },
  { id: "pro_12m", label: "Pro, 12 months", months: 12, amount: 21900 },
];

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LEARNER_BASE_FEATURES = ["Daily Challenges", "Limited Practice Sessions", "1 Mock Test / Week", "Basic Resume Builder"];
const LEARNER_BASE_MISSING = ["AI Doubt Solver", "Resume PDF Downloads"];
const LEARNER_PRO_FEATURES = [
  "Unlimited Practice",
  "AI Doubt Solver",
  "Unlimited Mock Tests",
  "Unlimited company written tests",
  "Advanced Analytics",
  "Unlimited Resume PDF Downloads",
];

const YourPlan = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#15803d" }}>
    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.25)" }} />
    Your plan
  </span>
);

const Tick = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12" /></svg>
);
const Cross = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);

/**
 * Paid plan screen for independent learners and HR. Institutional accounts never reach it.
 * The browser sends only a plan id; the server prices the order and checks the payment signature.
 */
export function Subscription({ audience = "learner" }: { audience?: "learner" | "hr" }) {
  const { user, updateUser } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [selected, setSelected] = useState("pro_12m");
  const [paying, setPaying] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    api.get("/payments/plans")
      // The api client has already unwrapped node-api's { success, data } envelope.
      .then((res) => { if (Array.isArray(res.data) && res.data.length) setPlans(res.data); })
      .catch(() => { /* keep the fallback prices on screen */ });
  }, []);

  const { isPro, expiresAt } = planStatus(user);
  const expiryLabel = expiresAt ? formatPlanDate(expiresAt) : null;

  const docsAudience = audience === "hr" ? "recruiters" : "individuals";
  const plan = plans.find((p) => p.id === selected) ?? plans[0];
  const sixMonthTotal = plans.find((p) => p.months === 6)?.amount;
  const yearly = plans.find((p) => p.months === 12);
  const saving = sixMonthTotal && yearly ? sixMonthTotal * 2 - yearly.amount : 0;

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      updateUser(res.data);
    } catch { /* the next page load picks it up */ }
  }, [updateUser]);

  // Retries a few times: the money has already moved, so a dropped connection must not lose the upgrade.
  const confirmPayment = useCallback(async (response: RazorpaySuccess) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await api.post("/payments/verify", response);
        await refreshUser();
        toast.success("Payment received. Pro is now active on your account.");
        return;
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 400 || status === 404 || status === 409) {
          toast.error(err, "We could not verify this payment. If money was deducted, contact support with the payment ID " + response.razorpay_payment_id + ".");
          return;
        }
        if (attempt < 2) await wait(1500 * (attempt + 1));
      }
    }
    toast.error(`Payment received but not confirmed yet. Do not pay again. Refresh in a minute, or contact support with payment ID ${response.razorpay_payment_id}.`);
  }, [refreshUser]);

  const handlePay = async () => {
    if (!plan || paying) return;
    setPaying(true);
    try {
      if (!(await loadRazorpay()) || !window.Razorpay) {
        toast.error("The payment window could not load. Check your connection or ad blocker and try again.");
        setPaying(false);
        return;
      }
      const res = await api.post("/payments/create-order", { plan_id: plan.id });
      const order = res.data;
      if (!order?.order_id) throw new Error("The server returned no order");
      const checkout = new window.Razorpay({
        // The key that created the order always matches it; the env value is only a fallback.
        key: order.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: order.amount,
        currency: order.currency,
        name: "TalentSnaps",
        description: order.plan_label,
        order_id: order.order_id,
        prefill: {
          name: user?.full_name ? String(user.full_name) : undefined,
          email: user?.email ? String(user.email) : undefined,
        },
        theme: { color: "#0145f2" },
        handler: (response) => {
          confirmPayment(response).finally(() => { if (mounted.current) setPaying(false); });
        },
        modal: {
          ondismiss: () => {
            if (mounted.current) setPaying(false);
            toast.info("Payment cancelled. You were not charged.");
          },
        },
      });
      checkout.on("payment.failed", (failure: RazorpayFailure) => {
        toast.error(failure.error?.description || "The payment failed. You can try again with another method.");
      });
      checkout.open();
    } catch (err) {
      setPaying(false);
      // Only a failed HTTP call is a network problem. Anything else is a script error while opening
      // the payment window, and the shared error mapper would wrongly call it "Network error".
      if (!isAxiosError(err)) {
        console.error("Razorpay checkout could not open", err);
        const reason = err instanceof Error && err.message ? `: ${err.message}` : ".";
        toast.error(`Could not open the payment window${reason}`);
        return;
      }
      toast.error(err, "Could not start the payment. Please try again.");
    }
  };

  const proCard = (
    <div className="card pricing-card" style={{ flex: "1", minWidth: "300px", maxWidth: "440px", padding: "40px 32px", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)", border: "2px solid var(--accent)", position: "relative" }}>
      <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
        {audience === "hr" ? "TalentSnaps Pro" : "Most Popular"}
      </div>

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px 12px", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "var(--accent)" }}>Pro Plan</h3>
        <PlanChip variant="pro" />
        {isPro && <YourPlan />}
      </div>

      <div role="radiogroup" aria-label="Choose a plan" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
        {plans.map((p) => {
          const active = p.id === selected;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(p.id)}
              disabled={paying}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", textAlign: "left",
                padding: "14px 16px", borderRadius: "10px", cursor: "pointer", font: "inherit", color: "var(--text)",
                background: active ? "rgba(1,69,242,.06)" : "transparent",
                border: `2px solid ${active ? "var(--accent)" : "var(--border, #e2e8f0)"}`,
              }}
            >
              <span>
                <strong>{p.months === 12 ? "12 months" : `${p.months} months`}</strong>
                {p.months === 12 && saving > 0 && (
                  <span style={{ display: "block", fontSize: "12px", color: "#16a34a", fontWeight: 600 }}>Save {rupees(saving)} vs two 6-month plans</span>
                )}
              </span>
              <span style={{ fontSize: "22px", fontWeight: 800 }}>{rupees(p.amount)}</span>
            </button>
          );
        })}
      </div>

      {audience === "learner" && (
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
          {LEARNER_PRO_FEATURES.map((f, i) => (
            <li key={f} style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <Tick color="var(--accent)" />
              {i === 0 ? <><strong>Unlimited</strong> Practice</> : f}
            </li>
          ))}
        </ul>
      )}

      {isPro && (
        <p style={{ margin: "0 0 12px", fontSize: "14px", color: "var(--muted)", textAlign: "center" }}>
          Pro is active{expiryLabel ? ` until ${expiryLabel}` : ""}. Paying again adds the new period on top.
        </p>
      )}

      <button
        className="btn btn-p"
        style={{ width: "100%", padding: "12px", fontSize: "15px", boxShadow: "0 4px 12px rgba(37,99,235,0.2)" }}
        onClick={handlePay}
        disabled={paying || !plan}
      >
        {paying ? "Waiting for payment…" : plan ? `${isPro ? "Extend" : "Upgrade"} for ${rupees(plan.amount)}` : "Upgrade to Pro"}
      </button>
      <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
        Secure payment by Razorpay. UPI, cards and netbanking accepted.
      </p>
      <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
        One-time payment, no auto-renewal. By paying you agree to our{" "}
        <Link href={`/docs/${docsAudience}/terms-and-conditions`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Terms</Link>,{" "}
        <Link href={`/docs/${docsAudience}/refund-policy`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Refund Policy</Link>{" "}and{" "}
        <Link href={`/docs/${docsAudience}/privacy-policy`} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</Link>.
      </p>
    </div>
  );

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>Upgrade to Pro</h2>
        {audience === "learner" && (
          <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Get unlimited practice, AI doubt solving, and advanced placement readiness analytics.
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "24px", justifyContent: "center", maxWidth: "900px", margin: "0 auto", flexWrap: "wrap" }}>
        {audience === "learner" && (
          <div className="card pricing-card" style={{ flex: "1", minWidth: "300px", maxWidth: "440px", padding: "40px 32px", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px 12px", marginBottom: "8px" }}>
              <h3 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Base Plan</h3>
              <PlanChip variant="basic" />
              {!isPro && <YourPlan />}
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
              Free <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 500 }}>/ forever</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
              {LEARNER_BASE_FEATURES.map((f) => (
                <li key={f} style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}><Tick color="#16a34a" />{f}</li>
              ))}
              {LEARNER_BASE_MISSING.map((f) => (
                <li key={f} style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--muted)" }}><Cross />{f}</li>
              ))}
            </ul>
            <button className="btn" style={{ width: "100%", padding: "12px" }} disabled>
              {isPro ? "Included in Pro" : "Current Plan"}
            </button>
          </div>
        )}
        {proCard}
      </div>
    </div>
  );
}
