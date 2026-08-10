"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gamepad2, ShieldCheck, Trophy } from "lucide-react";
import { GoogleButton, AppleButton, EmailForm } from "@/components/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

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
    <div className={styles.container}>
      <div className={styles.shell}>
        <aside className={styles.showcase}>
          <div className={styles.showcaseBadge}>
            <Trophy size={14} />
            <span>Return to your archive</span>
          </div>
          <h1 className={styles.showcaseTitle}>Welcome back to Trophy Rooms.</h1>
          <p className={styles.showcaseCopy}>
            Pick up your active hunts, review your collection, and keep your public profile moving.
          </p>
          <div className={styles.showcasePoints}>
            <div className={styles.showcasePoint}>
              <Gamepad2 size={18} />
              <span>Continue tracking games across every platform family.</span>
            </div>
            <div className={styles.showcasePoint}>
              <ShieldCheck size={18} />
              <span>Jump straight into your dashboard and recent progress.</span>
            </div>
            <div className={styles.showcasePoint}>
              <Trophy size={18} />
              <span>Keep your collection, buylist, and trophy room in sync.</span>
            </div>
          </div>
        </aside>

        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.logo}>
              <Trophy size={40} />
            </span>
            <h2 className={styles.title}>Sign in</h2>
            <p className={styles.subtitle}>Use your account to continue to the dashboard.</p>
          </div>

          <div className={styles.card}>
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

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <span className={styles.dividerLine} />
            </div>

            <EmailForm
              onSubmit={handleEmailSignIn}
              loading={loading}
              error={error}
              submitLabel="Sign In"
            />

            <p className={styles.footer}>
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className={styles.link}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
