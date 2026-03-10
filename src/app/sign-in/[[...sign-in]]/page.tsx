"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleButton, EmailForm } from "@/components/auth";
import styles from "./page.module.css";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleEmailSignIn = async (email: string, password: string) => {
    if (!isLoaded || !signIn) return;

    setLoading(true);
    setError(undefined);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        setError("Sign in incomplete. Please try again.");
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message = clerkError.errors?.[0]?.message || "Invalid email or password";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    setOauthLoading(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message = clerkError.errors?.[0]?.message || "Failed to sign in with Google";
      setError(message);
      setOauthLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.logo}>🏆</span>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to Trophy Rooms</p>
        </div>

        <div className={styles.card}>
          <GoogleButton
            onClick={handleGoogleSignIn}
            loading={oauthLoading}
            label="Continue with Google"
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
  );
}
