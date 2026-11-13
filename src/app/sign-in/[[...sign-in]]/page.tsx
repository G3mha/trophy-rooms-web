"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard, AuthDivider, GoogleButton, AppleButton, EmailForm } from "@/components/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type OAuthProvider = "google" | "apple";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  const handleEmailSignIn = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();

    setLoading(true);
    setError(undefined);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    const supabase = getSupabaseBrowserClient();

    setOauthLoading(provider);
    setError(undefined);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/sso-callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(null);
    }
  };

  return (
    <AuthCard
      title="Sign in"
      footer={
        <p>
          Don&apos;t have an account? <Link href="/sign-up">Sign up</Link>
        </p>
      }
    >
      <GoogleButton
        onClick={() => handleOAuthSignIn("google")}
        loading={oauthLoading === "google"}
        label="Continue with Google"
      />
      <AppleButton
        onClick={() => handleOAuthSignIn("apple")}
        loading={oauthLoading === "apple"}
        label="Continue with Apple"
      />
      <AuthDivider />
      <EmailForm
        onSubmit={handleEmailSignIn}
        loading={loading}
        error={error}
        submitLabel="Sign In"
      />
    </AuthCard>
  );
}
