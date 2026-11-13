import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useUiStore } from "@/stores/uiStore";
import { PlanBadge } from "./PlanBadge";

describe("PlanBadge", () => {
  beforeEach(() => useUiStore.getState().setActiveScreen("dash"));

  it("shows Basic as a button that opens the learner Subscription screen", async () => {
    render(<PlanBadge isPro={false} expiresAt={null} role="student" />);
    await userEvent.click(screen.getByRole("button", { name: /Basic/ }));
    expect(useUiStore.getState().activeScreen).toBe("subs");
  });

  it("opens the HR Subscription screen for recruiters", async () => {
    render(<PlanBadge isPro={false} expiresAt={null} role="hr" />);
    await userEvent.click(screen.getByRole("button", { name: /Basic/ }));
    expect(useUiStore.getState().activeScreen).toBe("hr-subs");
  });

  it("shows Pro as a plain label with the end date in its tooltip", () => {
    render(<PlanBadge isPro expiresAt={new Date("2027-11-13T00:00:00Z")} role="student" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Pro").closest("span")?.getAttribute("title")).toMatch(/Pro until/);
  });
});
