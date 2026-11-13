import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api", () => ({ api: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) } }));

const updateUser = vi.fn();
let storeUser: Record<string, unknown> = { id: "u1", full_name: "Kavi", email: "k@example.com", role: "student", preferences: {} };
vi.mock("@/stores/authStore", () => ({ useAuthStore: () => ({ user: storeUser, updateUser }) }));

vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const razorpayInstances: { options: Record<string, unknown>; open: ReturnType<typeof vi.fn> }[] = [];
vi.mock("@/lib/razorpay", () => ({ loadRazorpay: vi.fn().mockResolvedValue(true) }));

import { Subscription } from "./Subscription";

describe("Subscription (Razorpay checkout)", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    razorpayInstances.length = 0;
    storeUser = { id: "u1", full_name: "Kavi", email: "k@example.com", role: "student", preferences: {} };
    get.mockResolvedValue({
      data: { data: [
        { id: "pro_6m", label: "Pro, 6 months", months: 6, amount: 11900 },
        { id: "pro_12m", label: "Pro, 12 months", months: 12, amount: 21900 },
      ] },
    });
    // A minimal Razorpay stand-in so we can inspect what the screen hands it.
    window.Razorpay = function (this: unknown, options: Record<string, unknown>) {
      const instance = { options, open: vi.fn(), on: vi.fn() };
      razorpayInstances.push(instance);
      return instance;
    } as unknown as typeof window.Razorpay;
  });

  it("renders both plans with prices and a pay button", async () => {
    render(<Subscription />);
    expect(await screen.findByText("₹119")).toBeTruthy();
    expect(screen.getByText("₹219")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Upgrade for ₹219/ })).toBeTruthy();
  });

  it("creates an order for the chosen plan id only, then opens checkout with the server's order", async () => {
    post.mockResolvedValue({ data: { data: { order_id: "order_1", amount: 11900, currency: "INR", key_id: "rzp_test_key", plan_label: "Pro, 6 months" } } });
    render(<Subscription />);
    await userEvent.click(await screen.findByRole("radio", { name: /6 months/ }));
    await userEvent.click(screen.getByRole("button", { name: /Upgrade for ₹119/ }));

    await waitFor(() => expect(razorpayInstances).toHaveLength(1));
    expect(post).toHaveBeenCalledWith("/payments/create-order", { plan_id: "pro_6m" });
    expect(razorpayInstances[0].options).toMatchObject({ key: "rzp_test_key", order_id: "order_1", amount: 11900, currency: "INR" });
    expect(razorpayInstances[0].open).toHaveBeenCalled();
  });

  it("sends all three payment fields to verify on success and refreshes the user", async () => {
    post.mockResolvedValueOnce({ data: { data: { order_id: "order_2", amount: 21900, currency: "INR", key_id: "rzp_test_key", plan_label: "x" } } });
    post.mockResolvedValueOnce({ data: { data: { verified: true } } });
    get.mockImplementation((url: string) =>
      url === "/auth/me" ? Promise.resolve({ data: { id: "u1", preferences: { plan: "pro" } } }) : Promise.resolve({ data: { data: [] } }));
    render(<Subscription />);
    await userEvent.click(await screen.findByRole("button", { name: /Upgrade for/ }));
    await waitFor(() => expect(razorpayInstances).toHaveLength(1));

    const handler = razorpayInstances[0].options.handler as (r: Record<string, string>) => void;
    const response = { razorpay_payment_id: "pay_1", razorpay_order_id: "order_2", razorpay_signature: "sig" };
    handler(response);
    await waitFor(() => expect(post).toHaveBeenCalledWith("/payments/verify", response));
    await waitFor(() => expect(updateUser).toHaveBeenCalled());
  });

  it("shows only the Pro card for HR", async () => {
    storeUser = { ...storeUser, role: "hr" };
    render(<Subscription audience="hr" />);
    expect(await screen.findByText("₹219")).toBeTruthy();
    expect(screen.queryByText("Base Plan")).toBeNull();
  });

  it("treats an expired plan as not Pro", async () => {
    storeUser = { ...storeUser, preferences: { plan: "pro", plan_expires_at: "2020-01-01T00:00:00.000Z" } };
    render(<Subscription />);
    expect(await screen.findByRole("button", { name: /Upgrade for/ })).toBeTruthy();
  });
});
