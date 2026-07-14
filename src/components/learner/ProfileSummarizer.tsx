"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export function ProfileSummarizer() {
  const { user } = useAuthStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = async () => {
    const element = document.getElementById('profile-report');
    if (!element) return;
    
    setIsGenerating(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin:       [0.2, 0.2, 0.2, 0.2],
        filename:     `${user?.name || 'Student'}_Profile_Report.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="screen active" style={{ padding: "40px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)" }}>AI Profile Summarizer</h2>
        <p style={{ color: "var(--muted)", fontSize: "15px" }}>Your AI-generated performance profile and career readiness score.</p>
      </div>

      <div id="profile-report" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", background: "var(--bg)", padding: "16px" }}>
        
        {/* Left Column: Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="card" style={{ padding: "32px", borderTop: "4px solid var(--accent)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "24px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--accent-l)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="32" height="32"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12L2.3 9.7"></path><path d="M12 12l9.7 2.3"></path></svg>
              </div>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Executive Summary</h3>
                <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6 }}>
                  {user?.name || "Student"} has demonstrated strong analytical capabilities, ranking in the top 15% for Quantitative Aptitude. Recent Mock Interview performance indicates a high readiness for technical roles, particularly in software engineering. Communication skills are above average but can be improved with further verbal practice.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Top Skill</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Quantitative</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Weakness</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>Verbal Comm.</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>Ideal Role</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent)" }}>Software Dev</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>Growth Trends</h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {[
                { label: "Quantitative", score: "+12%", color: "var(--accent)", bg: "var(--accent-l)" },
                { label: "Logical", score: "+5%", color: "var(--purple)", bg: "var(--purple-l)" },
                { label: "Verbal", score: "-2%", color: "var(--red)", bg: "var(--red-l)" },
                { label: "Interviews", score: "+8%", color: "var(--teal)", bg: "var(--teal-l)" }
              ].map(t => (
                <div key={t.label} style={{ flex: "1 1 calc(50% - 8px)", padding: "16px", borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>{t.label}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px", fontWeight: 800, color: t.score.startsWith("+") ? "#16a34a" : "#dc2626" }}>{t.score}</span>
                    <span style={{ fontSize: "12px", background: t.bg, color: t.color, padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>This Month</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column: Readiness Score */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="card" style={{ padding: "32px", textAlign: "center" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "24px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Placement Readiness</h3>
            
            <div style={{ position: "relative", width: "160px", height: "160px", margin: "0 auto 24px" }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%" }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="82, 100" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: "42px", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>82</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>/ 100</div>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ color: "var(--muted)" }}>Aptitude:</span>
                <span style={{ color: "var(--text)" }}>80%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ color: "var(--muted)" }}>Interview:</span>
                <span style={{ color: "var(--text)" }}>75%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 600 }}>
                <span style={{ color: "var(--muted)" }}>Resume:</span>
                <span style={{ color: "var(--text)" }}>85%</span>
              </div>
            </div>
            
            <button 
              className="btn btn-p" 
              style={{ width: "100%" }}
              onClick={handlePrint}
              disabled={isGenerating}
            >
              {isGenerating ? "Exporting..." : "Download Full Report"}
            </button>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
