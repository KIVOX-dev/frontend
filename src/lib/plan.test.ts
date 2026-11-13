import { describe, expect, it } from "vitest";
import { planStatus } from "./plan";

const now = new Date("2026-11-13T00:00:00Z");

describe("planStatus", () => {
  it("is Basic by default and eligible for an independent learner", () => {
    expect(planStatus({ role: "student", preferences: {} }, now)).toMatchObject({ eligible: true, isPro: false });
  });

  it("is Pro until the expiry date, then Basic", () => {
    const active = { role: "student", preferences: { plan: "pro", plan_expires_at: "2027-01-01T00:00:00Z" } };
    const lapsed = { role: "student", preferences: { plan: "pro", plan_expires_at: "2026-01-01T00:00:00Z" } };
    expect(planStatus(active, now).isPro).toBe(true);
    expect(planStatus(lapsed, now).isPro).toBe(false);
  });

  it("only learners without a college and recruiters are eligible to buy", () => {
    expect(planStatus({ role: "student", college_id: "c1" }, now).eligible).toBe(false);
    expect(planStatus({ role: "faculty" }, now).eligible).toBe(false);
    expect(planStatus({ role: "institution_admin" }, now).eligible).toBe(false);
    expect(planStatus({ role: "hr" }, now).eligible).toBe(true);
    expect(planStatus({ role: "recruiter" }, now).eligible).toBe(true);
  });
});
