"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Field, Label, Input, FieldError } from "@/components/ui/Input";
import { IntegrationsSection } from "@/components/shared/IntegrationsSection";
import { GoogleAccountRow } from "@/components/shared/GoogleAccountRow";
import { isGoogleLoginConfigured } from "@/lib/googleIdentity";
import { cn } from "@/lib/utils";

type SettingsTab = "account" | "integrations";

/**
 * Matches the reference layout exactly: a plain left sub-nav (Account /
 * Integrations, no identity card or Log Out — those live in the profile
 * chip's dropdown, ProfileMenu.tsx) and a right-hand content area where each
 * setting is its own title+description / field row. Account tab covers
 * email + password + linked sign-in accounts (Google); Integrations tab
 * reuses the exact same IntegrationsSection.tsx as ProfilePanel.tsx's own
 * Integrations tab — one component, two entry points.
 */
export function SettingsPanel() {
  const { user } = useAuthStore();
  const isStudent = user?.role === "student";

  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
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

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-heading-l mb-1">Settings</h1>
        <p className="text-body text-ink-muted">Manage your account and connected apps.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: plain sub-nav */}
        <div className="md:w-52 shrink-0">
          <SettingsNavItem active={activeTab === "account"} onClick={() => setActiveTab("account")}>
            Account
          </SettingsNavItem>
          {isStudent && (
            <SettingsNavItem active={activeTab === "integrations"} onClick={() => setActiveTab("integrations")}>
              Integrations
            </SettingsNavItem>
          )}
        </div>

        {/* Right: content */}
        <div className="flex-1 min-w-0">
          {activeTab === "account" && (
            <div className="max-w-3xl">
              <SettingsRow title="Email Address" description="Your account's sign-in email.">
                <Field>
                  <Input value={user?.email || ""} disabled readOnly />
                </Field>
              </SettingsRow>

              <SettingsRow title="Change password" description="Update your password to keep your account secure.">
                {pwdMsg && <p className="text-small text-success mb-3">{pwdMsg}</p>}
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
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
                  <Button type="submit" loading={changingPwd}>
                    Save
                  </Button>
                </form>
              </SettingsRow>

              {isGoogleLoginConfigured && (
                <SettingsRow title="Connect with social accounts" description="Services that you can use to sign in to your account.">
                  <GoogleAccountRow />
                </SettingsRow>
              )}
            </div>
          )}

          {activeTab === "integrations" && isStudent && <IntegrationsSection />}
        </div>
      </div>
    </div>
  );
}

function SettingsNavItem({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150",
        active ? "bg-paper-tint text-ink" : "text-ink-muted hover:text-ink hover:bg-paper-tint"
      )}
    >
      {children}
    </button>
  );
}

function SettingsRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 py-6 border-b border-line last:border-b-0">
      <div className="sm:w-56 shrink-0">
        <h3 className="font-semibold text-ink mb-1">{title}</h3>
        <p className="text-small">{description}</p>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
