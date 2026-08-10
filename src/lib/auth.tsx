"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthState {
  /** False until the initial session check resolves */
  isLoaded: boolean;
  isSignedIn: boolean;
  user: User | null;
  /** Supabase auth user id (UUID) */
  userId: string | null;
}

const AuthContext = createContext<AuthState>({
  isLoaded: false,
  isSignedIn: false,
  user: null,
  userId: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoaded: false,
    isSignedIn: false,
    user: null,
    userId: null,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      setState({
        isLoaded: true,
        isSignedIn: data.session !== null,
        user: data.session?.user ?? null,
        userId: data.session?.user.id ?? null,
      });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          isLoaded: true,
          isSignedIn: session !== null,
          user: session?.user ?? null,
          userId: session?.user.id ?? null,
        });
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function RedirectToSignIn() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sign-in");
  }, [router]);

  return null;
}
