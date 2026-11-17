"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useAuth, RedirectToSignIn } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageSkeleton, FormAlert, Button } from "@/components";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import styles from "./page.module.css";

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
] as const;

const MIN_PASSWORD_LENGTH = 8;

export default function AccountPage() {
  const { isLoaded, isSignedIn } = useAuth();
  // Fetched from the server (not the session) so identities and a pending
  // email change are current after linking, unlinking, or confirming.
  const [user, setUser] = useState<User | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [savingEmail, setSavingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [savingPassword, setSavingPassword] = useState(false);

  const [providerError, setProviderError] = useState<string>();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    const { data } = await getSupabaseBrowserClient().auth.getUser();
    setUser(data.user);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    loadUser();
    // Supabase sends OAuth link failures (e.g. that Google account already
    // belongs to another user) back here as query params.
    const linkError = new URLSearchParams(window.location.search).get("error_description");
    if (linkError) setProviderError(linkError);
  }, [isSignedIn, loadUser]);

  if (!isLoaded || (isSignedIn && !user)) {
    return (
      <div className={styles.container}>
        <PageSkeleton variant="rows" label="Loading account" />
      </div>
    );
  }
  if (!isSignedIn || !user) return <RedirectToSignIn />;

  const identities = user.identities ?? [];
  const redirectTo = `${window.location.origin}/account`;

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmail(true);
    setEmailError(undefined);
    const { error } = await getSupabaseBrowserClient().auth.updateUser(
      { email: newEmail.trim() },
      { emailRedirectTo: redirectTo }
    );
    setSavingEmail(false);
    if (error) {
      setEmailError(error.message);
      return;
    }
    setNewEmail("");
    toast.success("Check both inboxes to confirm the change");
    loadUser();
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }
    setSavingPassword(true);
    setPasswordError(undefined);
    const { error } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    toast.success("Password saved");
  };

  const handleConnect = async (provider: (typeof PROVIDERS)[number]["id"]) => {
    setBusyProvider(provider);
    setProviderError(undefined);
    const { error } = await getSupabaseBrowserClient().auth.linkIdentity({
      provider,
      options: { redirectTo },
    });
    // On success the browser is already leaving for the provider
    if (error) {
      setProviderError(error.message);
      setBusyProvider(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    const identity = identities.find((i) => i.provider === provider);
    if (!identity) return;
    setBusyProvider(provider);
    setProviderError(undefined);
    const { error } = await getSupabaseBrowserClient().auth.unlinkIdentity(identity);
    setBusyProvider(null);
    if (error) {
      setProviderError(error.message);
      return;
    }
    toast.success("Disconnected");
    loadUser();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <Settings size={22} /> Account
      </h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Email</h2>
        <p className={styles.current}>{user.email}</p>
        {user.new_email && (
          <p className={styles.pending}>
            Waiting for confirmation to switch to {user.new_email}. Open the links sent to
            both addresses.
          </p>
        )}
        <form className={styles.form} onSubmit={handleEmailChange}>
          <FormField label="New email">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={savingEmail}
            />
          </FormField>
          {emailError && <FormAlert message={emailError} />}
          <Button type="submit" size="sm" loading={savingEmail} disabled={!newEmail.trim()}>
            Change email
          </Button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Password</h2>
        <form className={styles.form} onSubmit={handlePasswordChange}>
          <FormField label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters`}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              disabled={savingPassword}
            />
          </FormField>
          <FormField label="Confirm new password">
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              disabled={savingPassword}
            />
          </FormField>
          {passwordError && <FormAlert message={passwordError} />}
          <Button
            type="submit"
            size="sm"
            loading={savingPassword}
            disabled={!password || !confirmPassword}
          >
            Save password
          </Button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Sign-in methods</h2>
        <ul className={styles.providerList}>
          {PROVIDERS.map(({ id, label }) => {
            const identity = identities.find((i) => i.provider === id);
            const identityEmail = identity?.identity_data?.email as string | undefined;
            return (
              <li key={id} className={styles.providerRow}>
                <div className={styles.providerInfo}>
                  <span className={styles.providerName}>{label}</span>
                  {identity && identityEmail && (
                    <span className={styles.providerEmail}>{identityEmail}</span>
                  )}
                </div>
                {identity ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busyProvider === id}
                    // Supabase refuses to remove the last way to sign in
                    disabled={identities.length < 2}
                    onClick={() => handleDisconnect(id)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busyProvider === id}
                    onClick={() => handleConnect(id)}
                  >
                    Connect
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {providerError && <FormAlert message={providerError} />}
      </section>
    </div>
  );
}
