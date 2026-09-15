"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useUiStore } from "@/stores/uiStore";

type UserResult = { id: string; full_name?: string; email?: string; role?: string };
type PlacementResult = { id: string; title?: string; company_name?: string; status?: string };
type PlacementRecordResult = { id: string; company_name?: string; role?: string; status?: string };

type SearchData = {
  users: UserResult[];
  placements: PlacementResult[];
  placement_records: PlacementRecordResult[];
};

/**
 * Destination for TopbarSearch.tsx's Enter-to-navigate (?screen=search-results&q=...).
 * Selecting any result sets useUiStore's searchFocusId before navigating —
 * CollegeAdminDashboard.tsx picks that up to scroll to and briefly highlight
 * the matching row (see its own comment on the focus effect).
 */
export function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const { setActiveScreen, setSearchFocusId } = useUiStore();

  const [data, setData] = useState<SearchData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .get(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const goTo = (screen: string, id: string) => {
    setSearchFocusId(id);
    setActiveScreen(screen);
  };

  const totalResults = data ? data.users.length + data.placements.length + data.placement_records.length : 0;

  return (
    <div className="screen active" style={{ padding: "24px 40px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>
          Search results for &ldquo;{q}&rdquo;
        </h2>
        {data && <p style={{ color: "var(--muted)", fontSize: "14px" }}>{totalResults} result{totalResults === 1 ? "" : "s"}</p>}
      </div>

      {loading && <div style={{ color: "var(--muted)", fontSize: "14px" }}>Searching…</div>}
      {error && <div style={{ color: "var(--red, #dc2626)", fontSize: "14px" }}>Search failed. Please try again.</div>}

      {data && totalResults === 0 && (
        <div style={{ color: "var(--muted)", fontSize: "14px", padding: "20px 0" }}>No matches for &ldquo;{q}&rdquo;.</div>
      )}

      {data && data.users.length > 0 && (
        <ResultGroup title="Users">
          {data.users.map((u) => (
            <ResultRow key={u.id} title={u.full_name || "—"} subtitle={u.email} tag={u.role} onClick={() => goTo("users", u.id)} />
          ))}
        </ResultGroup>
      )}

      {data && data.placements.length > 0 && (
        <ResultGroup title="Placement Drives">
          {data.placements.map((p) => (
            <ResultRow key={p.id} title={p.title || "—"} subtitle={p.company_name} tag={p.status} onClick={() => goTo("drives", p.id)} />
          ))}
        </ResultGroup>
      )}

      {data && data.placement_records.length > 0 && (
        <ResultGroup title="Recent Placements">
          {data.placement_records.map((r) => (
            <ResultRow key={r.id} title={r.company_name || "—"} subtitle={r.role} tag={r.status} onClick={() => goTo("placements", r.id)} />
          ))}
        </ResultGroup>
      )}
    </div>
  );
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: "16px", padding: "8px 0" }}>
      <div style={{ padding: "10px 16px", fontWeight: 700, fontSize: "13px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ title, subtitle, tag, onClick }: { title: string; subtitle?: string; tag?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        background: "none",
        border: "none",
        borderTop: "1px solid var(--border)",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{title}</div>
        {subtitle && <div style={{ fontSize: "12px", color: "var(--muted)" }}>{subtitle}</div>}
      </div>
      {tag && <span className="badge bb" style={{ textTransform: "capitalize" }}>{tag.replace(/_/g, " ")}</span>}
    </button>
  );
}
