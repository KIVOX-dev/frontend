import { useCallback, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";

/**
 * Shared email/password login state + submit logic behind every role's
 * login form (college admin, faculty, super admin, institutional student,
 * HR, learner) — previously each of those six components hand-rolled its
 * own copy of this exact state/POST/error-mapping (see
 * FULL_STACK_AUDIT_REPORT.md FE-008). Registration/signup panels differ too
 * much per role (institution fields vs. company fields vs. student fields)
 * to fold in here, so those stay page-specific and just reuse the setters
 * this hook already exposes (`setError`/`setLoading`) to share one error/
 * loading surface with the login panel next to them.
 */
export function useLoginForm(options?: { fallbackErrorMessage?: string }) {
  const authLogin = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useCallback(
    async (extraPayload?: Record<string, unknown>): Promise<boolean> => {
      setError("");
      if (!email.trim() || !password.trim()) {
        setError("Please enter your email and password.");
        return false;
      }
      setLoading(true);
      try {
        const res = await api.post("/auth/login", { email: email.trim(), password, ...extraPayload });
        const { user, access_token } = res.data;
        authLogin(
          {
            id: user._id || user.id,
            name: user.name || user.full_name,
            email: user.email,
            role: user.role,
            college_id: user.college_id || user.collegeId,
            college_name: user.college_name,
            company_name: user.company_name,
          },
          access_token
        );
        return true;
      } catch (err: unknown) {
        // Backend's generic auth-failure wording, reworded for every login
        // form the same way (previously duplicated per-component).
        let message = extractErrorMessage(err, options?.fallbackErrorMessage ?? "Invalid password or email");
        if (message === "Incorrect email or password") message = "Invalid password or email";
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [email, password, authLogin, options?.fallbackErrorMessage]
  );

  return { email, setEmail, password, setPassword, error, setError, loading, setLoading, login };
}
