"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailCheck, Sparkles, Trophy } from "lucide-react";
import { GoogleButton, AppleButton, EmailForm, VerificationCodeInput } from "@/components/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type SignUpStep = "form" | "verification";
type OAuthProvider = "google" | "apple";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignUpStep>("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleEmailSignUp = async (email: string, password: string) => {
    const supabase = getSupabaseBrowserClient();

    setLoading(true);
    setError(undefined);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Supabase returns an obfuscated user with no identities when the email
    // is already registered and confirmed
    if (data.user && data.user.identities?.length === 0) {
      setError("An account with this email already exists. Try signing in instead.");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setPendingEmail(email);
    setStep("verification");
  };

  const handleVerification = async (code: string) => {
    const supabase = getSupabaseBrowserClient();

    setVerificationLoading(true);
    setError(undefined);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: code,
      type: "signup",
    });

    if (verifyError) {
      setError(verifyError.message);
      setVerificationLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleOAuthSignUp = async (provider: OAuthProvider) => {
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

  const handleResendCode = async () => {
    const supabase = getSupabaseBrowserClient();

    setError(undefined);

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
    });

    if (resendError) {
      setError(resendError.message);
    }
  };

  if (step === "verification") {
    return (
      <div className={styles.container}>
        <div className={styles.shell}>
          <aside className={styles.showcase}>
            <div className={styles.showcaseBadge}>
              <MailCheck size={14} />
              <span>Almost there</span>
            </div>
            <h1 className={styles.showcaseTitle}>Verify your email and open the room.</h1>
            <p className={styles.showcaseCopy}>
              Finish verification to activate your account and unlock the full dashboard.
            </p>
            <div className={styles.showcasePoints}>
              <div className={styles.showcasePoint}>
                <MailCheck size={18} />
                <span>Use the code we sent to confirm ownership of your email.</span>
              </div>
              <div className={styles.showcasePoint}>
                <Sparkles size={18} />
                <span>Your dashboard, library, and collection will be ready right after this step.</span>
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            <div className={styles.header}>
              <span className={styles.logo}><Trophy size={40} /></span>
              <h2 className={styles.title}>Verify your email</h2>
              <p className={styles.subtitle}>
                We sent a verification code to {pendingEmail}.
              </p>
            </div>

            <div className={styles.card}>
              <VerificationCodeInput
                onComplete={handleVerification}
                loading={verificationLoading}
                error={error}
              />

              <p className={styles.resendText}>
                Didn&apos;t receive a code?{" "}
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResendCode}
                >
                  Resend
                </button>
              </p>

              <button
                type="button"
                className={styles.backButton}
                onClick={() => setStep("form")}
              >
                Back to sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <aside className={styles.showcase}>
          <div className={styles.showcaseBadge}>
            <Sparkles size={14} />
            <span>Start your trophy room</span>
          </div>
          <h1 className={styles.showcaseTitle}>Create an account and start curating.</h1>
          <p className={styles.showcaseCopy}>
            Build your library, manage the backlog, and make your completion history worth revisiting.
          </p>
          <div className={styles.showcasePoints}>
            <div className={styles.showcasePoint}>
              <Trophy size={18} />
              <span>Track achievements and trophies across your games and DLC.</span>
            </div>
            <div className={styles.showcasePoint}>
              <Sparkles size={18} />
              <span>Keep buylist, collection, and dashboard progress in one system.</span>
            </div>
            <div className={styles.showcasePoint}>
              <MailCheck size={18} />
              <span>Verify once, then jump directly into your personalized dashboard.</span>
            </div>
          </div>
        </aside>

        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.logo}><Trophy size={40} /></span>
            <h2 className={styles.title}>Create account</h2>
            <p className={styles.subtitle}>Join Trophy Rooms and start tracking with intent.</p>
          </div>

          <div className={styles.card}>
            <GoogleButton
              onClick={() => handleOAuthSignUp("google")}
              loading={oauthLoading === "google"}
              label="Continue with Google"
            />

            <AppleButton
              onClick={() => handleOAuthSignUp("apple")}
              loading={oauthLoading === "apple"}
              label="Continue with Apple"
            />

            <div className={styles.divider}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>or</span>
              <span className={styles.dividerLine} />
            </div>

            <EmailForm
              onSubmit={handleEmailSignUp}
              loading={loading}
              error={error}
              submitLabel="Create Account"
              showPasswordRequirements
            />

            <p className={styles.footer}>
              Already have an account?{" "}
              <Link href="/sign-in" className={styles.link}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
