"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";

export function Subscription() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      if (!user) return;
      const currentPrefs = (user.preferences ?? {}) as Record<string, unknown>;
      const res = await api.put(`/users/${user.id}`, { preferences: { ...currentPrefs, plan: "pro" } });
      updateUser(res.data);
      alert("Upgraded to Pro successfully!");
    } catch (err) {
      alert("Failed to upgrade");
    } finally {
      setLoading(false);
    }
  };

  const prefs = (user?.preferences ?? {}) as Record<string, unknown>;
  const isPro = prefs["plan"] === "pro";

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>Upgrade to Pro</h2>
        <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
          Get unlimited practice, AI doubt solving, and advanced placement readiness analytics.
        </p>
      </div>

      <div style={{ display: "flex", gap: "24px", justifyContent: "center", maxWidth: "900px", margin: "0 auto", flexWrap: "wrap" }}>
        
        {/* Base Plan */}
        <div className="card" style={{ flex: "1", minWidth: "300px", padding: "40px 32px", position: "relative" }}>
          <h3 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Base Plan</h3>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
            Free <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 500 }}>/ forever</span>
          </div>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Daily Challenges
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Limited Practice Sessions
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              1 Mock Test / Week
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Basic Resume Builder
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              AI Doubt Solver
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Resume PDF Downloads
            </li>
          </ul>
          
          <button className="btn" style={{ width: "100%", padding: "12px" }} disabled>
            {isPro ? "Downgrade" : "Current Plan"}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="card" style={{ flex: "1", minWidth: "300px", padding: "40px 32px", background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)", border: "2px solid var(--accent)", position: "relative" }}>
          <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
            Most Popular
          </div>
          
          <h3 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "var(--accent)" }}>Pro Plan</h3>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text)", marginBottom: "24px" }}>
            ₹299 <span style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 500 }}>/ month</span>
          </div>
          
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <strong>Unlimited</strong> Practice
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              AI Doubt Solver
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Unlimited Mock Tests
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Unlimited MNC Tests
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Advanced Analytics
            </li>
            <li style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--text)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="18" height="18"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Unlimited Resume PDF Downloads
            </li>
          </ul>
          
          <button 
            className="btn btn-p" 
            style={{ width: "100%", padding: "12px", fontSize: "15px", boxShadow: "0 4px 12px rgba(37,99,235,0.2)" }} 
            onClick={handleUpgrade}
            disabled={isPro || loading}
          >
            {loading ? "Upgrading..." : isPro ? "Current Plan" : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
