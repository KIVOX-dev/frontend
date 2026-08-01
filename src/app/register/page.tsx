"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";

const VALID_ROLES = ["student", "hr", "college_admin"] as const;
type Role = (typeof VALID_ROLES)[number];

function isRole(value: string | null): value is Role {
  return VALID_ROLES.includes(value as Role);
}

// Separate component so useSearchParams is inside a Suspense boundary
function RegisterContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const initialRole = isRole(roleParam) ? roleParam : "student";

  return <RegisterForm initialRole={initialRole} />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}
