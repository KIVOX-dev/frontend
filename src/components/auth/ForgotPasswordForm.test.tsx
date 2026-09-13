import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

const postMock = vi.fn();
vi.mock("@/lib/api", () => ({
  api: { post: (...args: unknown[]) => postMock(...args) },
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("shows a validation error for an invalid email without calling the API", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it("submits and shows the generic success message — never reveals whether the account exists", async () => {
    postMock.mockResolvedValueOnce({ data: null });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/email/i), "student@college.edu");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    // turnstileToken is "" here because NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set in
    // the test environment — isTurnstileConfigured is false, so the widget never
    // renders and never blocks submission (see Turnstile.tsx); the field is still
    // sent on the payload either way.
    await waitFor(() =>
      expect(postMock).toHaveBeenCalledWith("/auth/forgot-password", { email: "student@college.edu", turnstileToken: "" })
    );
    expect(await screen.findByText(/if an account exists for that email/i)).toBeInTheDocument();
    expect(screen.queryByText(/no account/i)).not.toBeInTheDocument();
  });

  it("shows an operational error (e.g. rate limit) distinctly, without claiming success", async () => {
    postMock.mockRejectedValueOnce({
      response: { status: 429, headers: {}, data: { message: "Too many requests" } },
    });
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/email/i), "student@college.edu");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many requests/i);
    expect(screen.queryByText(/if an account exists for that email/i)).not.toBeInTheDocument();
  });
});
