"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types/database";

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRole(): UserRole | null {
  const { profile } = useAuth();
  return profile?.role ?? null;
}
