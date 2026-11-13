import type { ReactNode } from "react";

/**
 * Full-width "Show all →" row that sits under a list (LinkedIn style): a thin divider above,
 * centered label, trailing arrow. Renders a button, or a link when `href` is given.
 */
export function ShowAllRow({
  children = "Show all",
  onClick,
  href,
  expanded,
}: {
  children?: ReactNode;
  onClick?: () => void;
  href?: string;
  expanded?: boolean;
}) {
  const style: React.CSSProperties = {
    all: "unset",
    boxSizing: "border-box",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    marginTop: "8px",
    padding: "12px 16px",
    borderTop: "1px solid var(--border)",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text)",
  };
  const arrow = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
  if (href) {
    return (
      <a href={href} style={{ ...style, textDecoration: "none" }}>
        {children} {arrow}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} style={style}>
      {children} {arrow}
    </button>
  );
}
