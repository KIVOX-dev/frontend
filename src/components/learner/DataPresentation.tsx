"use client";

import { useMemo } from "react";
import { parseDataPresentation, type ParsedData } from "@/lib/dataPresentation";

// Draws the data a Data Interpretation question refers to — a bar chart, line
// graph, pie chart or table — instead of the raw "Bar chart: A=120, B=150"
// sentence. If the text can't be parsed with confidence it falls back to the
// original sentence, so a question is never left without its data.

const PALETTE = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
const W = 560;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 44, left: 52 };

/** A round upper bound and tick step for the value axis. */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 1, step: 0.25 };
  const rough = max / 5;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  return { top: Math.ceil(max / step) * step, step };
}

const fmt = (n: number) => (Number.isInteger(n) ? n.toLocaleString("en-IN") : String(Math.round(n * 100) / 100));

function Legend({ names }: { names: string[] }) {
  if (names.length < 2) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center", marginTop: "8px", fontSize: "12.5px", color: "var(--muted)" }}>
      {names.map((n, i) => (
        <span key={n + i} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: PALETTE[i % PALETTE.length] }} />
          {n}
        </span>
      ))}
    </div>
  );
}

function Axes({ top, step, plotW, plotH }: { top: number; step: number; plotW: number; plotH: number }) {
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return (
    <g>
      {ticks.map((v) => {
        const y = PAD.top + plotH - (v / top) * plotH;
        return (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left + plotW} y1={y} y2={y} stroke="var(--border)" strokeDasharray={v === 0 ? undefined : "3 4"} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{fmt(v)}</text>
          </g>
        );
      })}
    </g>
  );
}

function XLabels({ labels, plotW, plotH, band }: { labels: string[]; plotW: number; plotH: number; band: number }) {
  const long = labels.some((l) => l.length > 7) && labels.length > 4;
  return (
    <g>
      {labels.map((l, i) => {
        const x = PAD.left + band * i + band / 2;
        const y = PAD.top + plotH + 16;
        return long ? (
          <text key={l + i} x={x} y={y} textAnchor="end" fontSize="11" fill="var(--muted)" transform={`rotate(-30 ${x} ${y})`}>{l}</text>
        ) : (
          <text key={l + i} x={x} y={y} textAnchor="middle" fontSize="11.5" fill="var(--muted)">{l}</text>
        );
      })}
      <line x1={PAD.left} x2={PAD.left + plotW} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="var(--muted)" />
    </g>
  );
}

export function BarChart({ data }: { data: ParsedData }) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const { top, step } = niceScale(Math.max(...data.series.flatMap((s) => s.values)));
  const band = plotW / data.labels.length;
  const groupW = band * 0.7;
  const barW = groupW / data.series.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }} aria-hidden="true">
      <Axes top={top} step={step} plotW={plotW} plotH={plotH} />
      {data.labels.map((_, i) =>
        data.series.map((s, si) => {
          const h = (s.values[i] / top) * plotH;
          const x = PAD.left + band * i + (band - groupW) / 2 + barW * si;
          const y = PAD.top + plotH - h;
          return (
            <g key={`${i}-${si}`}>
              <rect x={x + 1} y={y} width={Math.max(barW - 2, 2)} height={h} rx="3" fill={PALETTE[si % PALETTE.length]} />
              {data.series.length <= 2 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">{fmt(s.values[i])}</text>
              )}
            </g>
          );
        })
      )}
      <XLabels labels={data.labels} plotW={plotW} plotH={plotH} band={band} />
    </svg>
  );
}

export function LineChart({ data }: { data: ParsedData }) {
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const { top, step } = niceScale(Math.max(...data.series.flatMap((s) => s.values)));
  const band = plotW / data.labels.length;
  const px = (i: number) => PAD.left + band * i + band / 2;
  const py = (v: number) => PAD.top + plotH - (v / top) * plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }} aria-hidden="true">
      <Axes top={top} step={step} plotW={plotW} plotH={plotH} />
      {data.series.map((s, si) => {
        const color = PALETTE[si % PALETTE.length];
        return (
          <g key={si}>
            <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" points={s.values.map((v, i) => `${px(i)},${py(v)}`).join(" ")} />
            {s.values.map((v, i) => (
              <g key={i}>
                <circle cx={px(i)} cy={py(v)} r="4.5" fill="var(--card, #fff)" stroke={color} strokeWidth="2.5" />
                {data.series.length <= 2 && (
                  <text x={px(i)} y={py(v) - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)">{fmt(v)}</text>
                )}
              </g>
            ))}
          </g>
        );
      })}
      <XLabels labels={data.labels} plotW={plotW} plotH={plotH} band={band} />
    </svg>
  );
}

export function PieChart({ data }: { data: ParsedData }) {
  const values = data.series[0].values;
  const total = values.reduce((a, b) => a + b, 0);
  const cx = 130;
  const cy = 130;
  const r = 110;
  let angle = -Math.PI / 2;
  const slices = values.map((v, i) => {
    const sweep = (v / total) * Math.PI * 2;
    const start = angle;
    angle += sweep;
    const mid = start + sweep / 2;
    const large = sweep > Math.PI ? 1 : 0;
    const p = (a: number, rad: number) => `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
    const path = values.length === 1
      ? `M ${cx - r},${cy} a ${r},${r} 0 1,0 ${2 * r},0 a ${r},${r} 0 1,0 ${-2 * r},0`
      : `M ${cx},${cy} L ${p(start, r)} A ${r},${r} 0 ${large} 1 ${p(angle, r)} Z`;
    return { path, color: data.colors?.[i] ?? PALETTE[i % PALETTE.length], label: data.labels[i], value: v, pct: (v / total) * 100, labelPos: p(mid, r * 0.62), big: sweep > 0.35 };
  });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "24px" }} aria-hidden="true">
      <svg viewBox="0 0 260 260" width="240" height="240">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="var(--card, #fff)" strokeWidth="2" />
        ))}
        {slices.filter((s) => s.big).map((s, i) => {
          const [x, y] = s.labelPos.split(",").map(Number);
          return <text key={i} x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">{Math.round(s.pct)}%</text>;
        })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px", color: "var(--text)" }}>
        {slices.map((s, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: s.color }} />
            {s.label}: <strong>{fmt(s.value)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function DataTable({ data }: { data: ParsedData }) {
  const cell: React.CSSProperties = { padding: "9px 14px", borderBottom: "1px solid var(--border)", textAlign: "center", fontSize: "14px" };
  const head: React.CSSProperties = { ...cell, background: "var(--bg)", fontWeight: 600, color: "var(--text)" };
  // Header = the labels when each series is a row (matrix); otherwise the series names.
  const unlabelled = data.labels.every((l, i) => l === String(i + 1));
  const singleSeries = data.series.length === 1;
  return (
    <div style={{ overflowX: "auto" }} aria-hidden="true">
      <table style={{ borderCollapse: "collapse", width: "100%", border: "1px solid var(--border)", borderRadius: 8 }}>
        <thead>
          <tr>
            {data.seriesAsRows ? (
              <>
                <th style={{ ...head, textAlign: "left" }} />
                {data.labels.map((l) => <th key={l} style={head}>{l}</th>)}
              </>
            ) : (
              <>
                <th style={{ ...head, textAlign: "left" }}>{unlabelled ? "#" : ""}</th>
                {data.series.map((s, i) => <th key={i} style={head}>{singleSeries && s.name.length > 28 ? "Value" : s.name}</th>)}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.seriesAsRows
            ? data.series.map((s, r) => (
                <tr key={r}>
                  <td style={{ ...cell, textAlign: "left", fontWeight: 600 }}>{s.name}</td>
                  {s.values.map((v, c) => <td key={c} style={cell}>{fmt(v)}</td>)}
                </tr>
              ))
            : data.labels.map((l, r) => (
                <tr key={r}>
                  <td style={{ ...cell, textAlign: "left", fontWeight: 600 }}>{l}</td>
                  {data.series.map((s, c) => <td key={c} style={cell}>{fmt(s.values[r])}</td>)}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export function DataPresentation({ text, accent }: { text: string; accent?: string }) {
  const data = useMemo(() => parseDataPresentation(text), [text]);
  const box: React.CSSProperties = { padding: "18px 20px", background: "var(--bg)", borderRadius: "12px", marginBottom: "20px", borderLeft: `3px solid ${accent ?? "var(--accent)"}` };

  if (!data) {
    return <div style={{ ...box, fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>📊 {text}</div>;
  }
  const multi = data.series.length > 1;
  return (
    <figure style={{ ...box, margin: "0 0 20px" }} role="img" aria-label={text}>
      {data.title && <figcaption style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "12px", textAlign: "center" }}>{data.title}</figcaption>}
      {data.kind === "bar" && <BarChart data={data} />}
      {data.kind === "line" && <LineChart data={data} />}
      {data.kind === "pie" && <PieChart data={data} />}
      {data.kind === "table" && <DataTable data={data} />}
      {(data.kind === "bar" || data.kind === "line") && multi && <Legend names={data.series.map((s) => s.name)} />}
    </figure>
  );
}
