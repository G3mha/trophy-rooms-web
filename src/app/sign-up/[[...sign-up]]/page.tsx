"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AuthCard,
  AuthDivider,
  GoogleButton,
  AppleButton,
  EmailForm,
  VerificationCodeInput,
} from "@/components/auth";
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
      <AuthCard
        title="Verify your email"
        subtitle={<>We sent a verification code to {pendingEmail}.</>}
        footer={
          <>
            <p>
              Didn&apos;t receive a code?{" "}
              <button type="button" onClick={handleResendCode}>
                Resend
              </button>
            </p>
            <p>
              <button type="button" onClick={() => setStep("form")}>
                Back to sign up
              </button>
            </p>
          </>
        }
      >
        <VerificationCodeInput
          onComplete={handleVerification}
          loading={verificationLoading}
          error={error}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account"
      footer={
        <>
          <p>
            Already have an account? <Link href="/sign-in">Sign in</Link>
          </p>
          <p className={styles.legal}>
            By creating an account you agree to the{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </>
      }
    >
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
      <AuthDivider />
      <EmailForm
        onSubmit={handleEmailSignUp}
        loading={loading}
        error={error}
        submitLabel="Create Account"
        showPasswordRequirements
      />
    </AuthCard>
  );
}
