"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Field, Label, Input, FieldError } from "@/components/ui/Input";

/**
 * Account security only — password change, identity summary, log out.
 * Deliberately separate from ProfilePanel.tsx ("who you are": basic info,
 * Student Details, Integrations) — this page is "how you log in," not
 * "what shows on your profile."
 */
export function SettingsPanel() {
  const { user, logout } = useAuthStore();

  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg("");
    setPwdError("");
    setChangingPwd(true);
    try {
      await api.put("/auth/change-password", pwdForm);
      setPwdMsg("Password changed successfully.");
      setPwdForm({ current_password: "", new_password: "" });
    } catch (err: unknown) {
      setPwdError(extractErrorMessage(err, "Failed to change password"));
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading-l mb-1">Settings</h1>
        <p className="text-body text-ink-muted">Manage your account security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: identity + log out */}
        <div className="md:w-64 shrink-0 space-y-4">
          <Card className="flex flex-col items-center text-center py-8">
            <Avatar fallback={initials} size="lg" className="mb-3" />
            <p className="font-semibold text-ink truncate max-w-full">{user?.name}</p>
            <p className="text-small truncate max-w-full">{user?.email}</p>
            <Badge tone="success" className="mt-3 capitalize">
              {user?.role?.replace("_", " ")}
            </Badge>
          </Card>

          <Button variant="danger" className="w-full justify-center" onClick={handleLogout}>
            <LogOut className="size-4" />
            Log Out
          </Button>
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0">
          <Card className="max-w-md">
            <h2 className="text-section-title mb-5">Change Password</h2>
            {pwdMsg && <p className="text-small text-success mb-4">{pwdMsg}</p>}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Field>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={pwdForm.current_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={pwdForm.new_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  placeholder="Must contain letters and numbers"
                  required
                  error={pwdError}
                />
                <FieldError>{pwdError}</FieldError>
              </Field>
              <Button type="submit" className="w-full justify-center" loading={changingPwd}>
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
