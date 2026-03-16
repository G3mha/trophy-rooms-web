"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { GoogleButton, EmailForm, VerificationCodeInput } from "@/components/auth";
import styles from "./page.module.css";

type SignUpStep = "form" | "verification";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [step, setStep] = useState<SignUpStep>("form");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const handleEmailSignUp = async (email: string, password: string) => {
    if (!isLoaded || !signUp) return;

    setLoading(true);
    setError(undefined);

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });

      setStep("verification");
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message = clerkError.errors?.[0]?.message || "Failed to create account";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (code: string) => {
    if (!isLoaded || !signUp) return;

    setVerificationLoading(true);
    setError(undefined);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message = clerkError.errors?.[0]?.message || "Invalid verification code";
      setError(message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    setOauthLoading(true);

    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message = clerkError.errors?.[0]?.message || "Failed to sign up with Google";
      setError(message);
      setOauthLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;

    setError(undefined);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: "email_code",
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message = clerkError.errors?.[0]?.message || "Failed to resend code";
      setError(message);
    }
  };

  if (step === "verification") {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.logo}><Trophy size={48} /></span>
            <h1 className={styles.title}>Verify Your Email</h1>
            <p className={styles.subtitle}>
              We sent a verification code to your email
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
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.logo}><Trophy size={48} /></span>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Trophy Rooms and start tracking</p>
        </div>

        <div className={styles.card}>
          <GoogleButton
            onClick={handleGoogleSignUp}
            loading={oauthLoading}
            label="Continue with Google"
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
  );
}
