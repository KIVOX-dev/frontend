import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionError, ChartErrorState, ChartEmptyState, formatCount, LIST_FETCH_CAP } from "./collegeAdminShared";

// FE-001: a failed loader must render a visibly different state than "the
// list came back empty" — these are the shared primitives every screen in
// CollegeAdminDashboard.tsx uses to draw that distinction.
describe("SectionError", () => {
  it("renders the error message, distinct from an empty-state message", () => {
    render(<SectionError message="Failed to load users" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/unable to load this data/i);
    expect(screen.getByText("Failed to load users")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<SectionError message="Failed to load users" onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("omits the retry button when onRetry isn't provided", () => {
    render(<SectionError message="Failed to load users" />);
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });
});

describe("ChartErrorState vs ChartEmptyState", () => {
  it("renders visibly different text for a failed chart vs. a genuinely empty one", () => {
    const { unmount } = render(<ChartErrorState message="Failed to load placements" />);
    expect(screen.getByText(/unable to load this data/i)).toBeInTheDocument();
    unmount();

    render(<ChartEmptyState message="No placements yet" />);
    expect(screen.getByText("No placements yet")).toBeInTheDocument();
    expect(screen.queryByText(/unable to load this data/i)).not.toBeInTheDocument();
  });
});

describe("formatCount (FE-007 truncation awareness)", () => {
  it("shows the exact count when under the server-side cap", () => {
    expect(formatCount(42)).toBe("42");
  });

  it("flags a count that has hit the server-side fetch cap as possibly truncated", () => {
    expect(formatCount(LIST_FETCH_CAP)).toBe(`${LIST_FETCH_CAP}+`);
  });
});
