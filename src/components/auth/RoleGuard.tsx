"use client";

import { useAuth } from "@/lib/auth-context";
import { canAccess } from "@/lib/auth";
import { usePathname } from "next/navigation";

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  if (!canAccess(profile.role, pathname)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">
            Truy cap bi tu choi
          </h2>
          <p className="mt-2 text-slate-500">
            Ban khong co quyen truy cap trang nay.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
