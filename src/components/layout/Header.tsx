"use client";

import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Header() {
  const { profile } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-800">
        {profile?.full_name ? `Xin chao, ${profile.full_name}` : "Hotel Management"}
      </h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 hover:bg-blue-200"
        >
          {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-11 z-10 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            <div className="border-b border-slate-100 px-4 py-2">
              <p className="text-sm font-medium text-slate-700 truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-slate-400">{profile?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
            >
              Dang xuat
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
