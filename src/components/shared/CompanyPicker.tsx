"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { CompanyLogo } from "@/components/institutional/collegeAdminShared";

// Common campus recruiters. Logos resolve through CompanyLogo's domain guess;
// anything not listed can still be typed in and used as-is.
export const COMPANY_OPTIONS = [
  "TCS", "Infosys", "Wipro", "HCLTech", "Tech Mahindra", "Cognizant", "Accenture", "Capgemini",
  "IBM", "Deloitte", "Zoho", "Mindtree", "Microsoft", "Google", "Amazon", "Flipkart",
  "Oracle", "SAP", "Adobe", "Cisco", "Dell", "Freshworks", "Paytm", "Zomato",
];

// One spelling per company, wherever it's shown: "tcs", "TCS " and "Tcs" all
// read "TCS". Listed companies use their catalog spelling; any other name
// typed entirely in lower case is title-cased, and a name with deliberate
// capitals (e.g. "iGate", "McKinsey") is left exactly as typed.
const companyKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
export function displayCompanyName(name: string | null | undefined): string {
  const clean = (name ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return "";
  const listed = COMPANY_OPTIONS.find((c) => companyKey(c) === companyKey(clean));
  if (listed) return listed;
  return clean === clean.toLowerCase() ? clean.replace(/(^|[\s&/-])[a-z]/g, (m) => m.toUpperCase()) : clean;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  /** Preview URL of a logo uploaded from the user's device (shown instead of the guessed one). */
  logoUrl?: string | null;
  uploading?: boolean;
  /** Provide to enable "Upload logo from device". */
  onUploadLogo?: (file: File) => void;
  onClearLogo?: () => void;
};

// Searchable company dropdown with logos. Typing filters the list; a name that
// isn't listed is offered as "Use “…”", so no recruiter is ever locked out.
export function CompanyPicker({ value, onChange, placeholder = "Select or type a company", required, logoUrl, uploading, onUploadLogo, onClearLogo }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const query = value.trim().toLowerCase();
  const matches = useMemo(
    () => COMPANY_OPTIONS.filter((c) => !query || c.toLowerCase().includes(query)),
    [query]
  );
  const exact = COMPANY_OPTIONS.some((c) => c.toLowerCase() === query);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
          {value.trim() || logoUrl ? <CompanyLogo name={value || "?"} size={22} logoUrl={logoUrl} /> : <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--bg)", border: "1px dashed var(--border)" }} />}
        </span>
        <input
          type="text"
          className="fi"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          required={required}
          placeholder={placeholder}
          style={{ paddingLeft: "42px", paddingRight: "36px", marginBottom: 0 }}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && open && matches.length > 0 && !exact) {
              e.preventDefault();
              pick(matches[0]);
            }
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Show companies"
          onClick={() => setOpen((o) => !o)}
          style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", padding: "6px", color: "var(--muted)", fontSize: "12px" }}
        >
          ▾
        </button>
      </div>

      {onUploadLogo && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", fontSize: "12px" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadLogo(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            style={{ border: "1px solid var(--border)", background: "transparent", borderRadius: "8px", padding: "5px 10px", cursor: uploading ? "default" : "pointer", color: "var(--text)", fontSize: "12px", fontWeight: 600 }}
          >
            {uploading ? "Uploading…" : logoUrl ? "Change logo" : "Upload logo from device"}
          </button>
          {logoUrl && onClearLogo && (
            <button type="button" onClick={onClearLogo} style={{ border: "none", background: "none", color: "var(--muted)", cursor: "pointer", fontSize: "12px", textDecoration: "underline", padding: 0 }}>
              Remove
            </button>
          )}
        </div>
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: "absolute", zIndex: 60, left: 0, right: 0, top: "calc(100% + 4px)", margin: 0, padding: "6px",
            listStyle: "none", maxHeight: "260px", overflowY: "auto", background: "var(--card-bg, #fff)",
            border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "0 12px 32px -8px rgba(0,0,0,0.18)",
          }}
        >
          {matches.map((c) => (
            <li key={c} role="option" aria-selected={c.toLowerCase() === query}>
              <button
                type="button"
                onClick={() => pick(c)}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 10px", border: "none", borderRadius: "8px", background: c.toLowerCase() === query ? "var(--bg)" : "transparent", cursor: "pointer", textAlign: "left", fontSize: "14px", color: "var(--text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = c.toLowerCase() === query ? "var(--bg)" : "transparent")}
              >
                <CompanyLogo name={c} size={26} />
                <span style={{ fontWeight: 600 }}>{c}</span>
              </button>
            </li>
          ))}
          {value.trim() && !exact && (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => pick(value.trim())}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "8px 10px", border: "none", borderTop: matches.length ? "1px solid var(--border)" : "none", background: "transparent", cursor: "pointer", textAlign: "left", fontSize: "14px", color: "var(--text)" }}
              >
                <CompanyLogo name={value} size={26} />
                <span>Use “<strong>{value.trim()}</strong>”</span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
