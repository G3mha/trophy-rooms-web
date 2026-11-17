"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { useAuth, RedirectToSignIn } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { PageSkeleton, FormAlert, Button } from "@/components";
import { AdminConfirmDialog } from "@/components/admin";
import { GoogleLogo, AppleLogo } from "@/components/auth";
import { DELETE_MY_ACCOUNT } from "@/graphql";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import styles from "./page.module.css";

const PROVIDERS = [
  { id: "google", label: "Google", Logo: GoogleLogo },
  { id: "apple", label: "Apple", Logo: AppleLogo },
] as const;

const MIN_PASSWORD_LENGTH = 8;

export default function AccountPage() {
  const { isLoaded, isSignedIn } = useAuth();
  // Fetched from the server (not the session) so identities and a pending
  // email change are current after linking, unlinking, or confirming.
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState<"email" | "password" | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [savingEmail, setSavingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [savingPassword, setSavingPassword] = useState(false);

  const [providerError, setProviderError] = useState<string>();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [deleteMyAccount, { loading: deleting }] = useMutation(DELETE_MY_ACCOUNT);

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

  const closeEditor = () => {
    setEditing(null);
    setNewEmail("");
    setEmailError(undefined);
    setPassword("");
    setConfirmPassword("");
    setPasswordError(undefined);
  };

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
    closeEditor();
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
    closeEditor();
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

  const handleDeleteAccount = async () => {
    setDeleteError(undefined);
    try {
      const { data } = await deleteMyAccount();
      if (!data?.deleteMyAccount?.success) {
        throw new Error(data?.deleteMyAccount?.error?.message ?? "Couldn't delete your account");
      }
    } catch (err) {
      setConfirmingDelete(false);
      setDeleteError(err instanceof Error ? err.message : "Couldn't delete your account");
      return;
    }
    // The identity is already gone server-side, so only clear this browser's session
    await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
    // Full reload so the Apollo cache drops the deleted user's data
    window.location.assign("/");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Account</h1>

      <ul className={styles.list}>
        <li className={styles.row}>
          <div className={styles.rowMain}>
            <span className={styles.rowLabel}>Email</span>
            <span className={styles.rowValue}>{user.email}</span>
            {user.new_email && (
              <span className={styles.pending}>
                Switching to {user.new_email} once you open the links sent to both addresses
              </span>
            )}
          </div>
          {editing !== "email" && (
            <Button variant="secondary" size="sm" onClick={() => { closeEditor(); setEditing("email"); }}>
              Change
            </Button>
          )}
          {editing === "email" && (
            <form className={styles.editor} onSubmit={handleEmailChange}>
              <FormField label="New email">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  required
                  disabled={savingEmail}
                />
              </FormField>
              {emailError && <FormAlert message={emailError} />}
              <div className={styles.editorActions}>
                <Button type="submit" size="sm" loading={savingEmail} disabled={!newEmail.trim()}>
                  Save email
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={closeEditor}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </li>

        <li className={styles.row}>
          <div className={styles.rowMain}>
            <span className={styles.rowLabel}>Password</span>
          </div>
          {editing !== "password" && (
            <Button variant="secondary" size="sm" onClick={() => { closeEditor(); setEditing("password"); }}>
              Change
            </Button>
          )}
          {editing === "password" && (
            <form className={styles.editor} onSubmit={handlePasswordChange}>
              <FormField label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters`}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  autoFocus
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
              <div className={styles.editorActions}>
                <Button
                  type="submit"
                  size="sm"
                  loading={savingPassword}
                  disabled={!password || !confirmPassword}
                >
                  Save password
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={closeEditor}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </li>
      </ul>

      <h2 className={styles.groupTitle}>Connected accounts</h2>
      <ul className={styles.list}>
        {PROVIDERS.map(({ id, label, Logo }) => {
          const identity = identities.find((i) => i.provider === id);
          const identityEmail = identity?.identity_data?.email as string | undefined;
          // Supabase refuses to remove the last way to sign in
          const onlySignIn = identities.length < 2;
          return (
            <li key={id} className={styles.row}>
              <span className={styles.logoTile}>
                <Logo className={styles.logo} />
              </span>
              <div className={styles.rowMain}>
                <span className={styles.rowLabel}>{label}</span>
                {identity && identityEmail && (
                  <span className={styles.rowValue}>{identityEmail}</span>
                )}
              </div>
              {identity ? (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={busyProvider === id}
                  disabled={onlySignIn}
                  title={onlySignIn ? "Add another way to sign in first" : undefined}
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

      <div className={styles.dangerRow}>
        <div className={styles.rowMain}>
          <span className={styles.rowLabel}>Delete account</span>
          <span className={styles.rowHint}>
            Deletes your sign-in and everything you&apos;ve tracked: library, collection,
            trophies, play journal, buylist, sell list and any achievement sets you made.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={styles.dangerButton}
          onClick={() => setConfirmingDelete(true)}
        >
          Delete
        </Button>
      </div>
      {deleteError && <FormAlert message={deleteError} />}

      <AdminConfirmDialog
        open={confirmingDelete}
        title="Delete your account?"
        description="Your account and all of its data will be deleted, and you'll be signed out."
        confirmLabel="Delete account"
        loading={deleting}
        onOpenChange={(open) => !deleting && setConfirmingDelete(open)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
