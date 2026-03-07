import type { UserRole } from "@/types/database";

// Pages accessible by each role
const roleAccess: Record<UserRole, string[]> = {
  admin: ["*"], // all pages
  receptionist: ["/", "/bookings"],
};

export function canAccess(role: UserRole, pathname: string): boolean {
  const allowed = roleAccess[role];
  if (allowed.includes("*")) return true;
  return allowed.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}
