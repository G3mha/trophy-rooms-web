"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { useAuth, RedirectToSignIn } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMutationMessage } from "@/lib/mutation-utils";
import { getInitials } from "@/lib/avatar-utils";
// The profile page's own cabinet palette, so the editor matches it
import { getAvatarColor } from "@/components/ProfileHeader";
import {
  BIO_MAX_LENGTH,
  NAME_MAX_LENGTH,
  SHOWCASE_LISTS,
  SOCIAL_NETWORKS,
  type ShowcaseGame,
  type ShowcaseKey,
  type SocialLink,
  type SocialNetwork,
} from "@/lib/profile";
import { AppImage, Button, FormAlert, PageSkeleton } from "@/components";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import {
  GET_MY_PROFILE,
  GET_MY_SHOWCASE_CANDIDATES,
  SET_PROFILE_SHOWCASE,
  UPDATE_MY_PROFILE,
} from "@/graphql";
import { ShowcaseEditor } from "./ShowcaseEditor";
import styles from "./page.module.css";

const AVATAR_SIZE = 512;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EMPTY_CANDIDATES: Partial<Record<ShowcaseKey, string>> = {
  platinums: "Earn a Platinum and it can go here.",
  collection: "Add games to your collection and they can go here.",
};

// Center-crops to a square and scales down, so phone photos fit the
// bucket's 2 MB limit and every avatar is the same size.
async function toAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(side, AVATAR_SIZE);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't read that image"))), "image/webp", 0.85)
  );
}

// What the save button would send, to tell whether anything changed
function formSnapshot(
  name: string,
  bio: string,
  handles: Partial<Record<SocialNetwork, string>>,
  showcases: Record<ShowcaseKey, ShowcaseGame[]>
): string {
  return JSON.stringify([
    name.trim(),
    bio.trim(),
    SOCIAL_NETWORKS.map(({ network }) => (handles[network] ?? "").trim()),
    SHOWCASE_LISTS.map(({ key }) => showcases[key].map((game) => game.id)),
  ]);
}

export default function EditProfilePage() {
  const { isLoaded, isSignedIn, userId: supabaseId } = useAuth();
  const { data, loading } = useQuery(GET_MY_PROFILE, { skip: !isSignedIn });
  const { data: platinumData } = useQuery(GET_MY_SHOWCASE_CANDIDATES, {
    variables: { list: "PLATINUMS" },
    skip: !isSignedIn,
  });
  const { data: collectionData } = useQuery(GET_MY_SHOWCASE_CANDIDATES, {
    variables: { list: "COLLECTION" },
    skip: !isSignedIn,
  });
  const [updateProfile] = useMutation(UPDATE_MY_PROFILE);
  const [setShowcase] = useMutation(SET_PROFILE_SHOWCASE);

  const profile = data?.me;
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [handles, setHandles] = useState<Partial<Record<SocialNetwork, string>>>({});
  const [showcases, setShowcases] = useState<Record<ShowcaseKey, ShowcaseGame[]>>({
    allTime: [],
    platinums: [],
    collection: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);
  const loadedFor = useRef<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>();
  const snapshot = formSnapshot(name, bio, handles, showcases);
  const dirty = savedSnapshot !== undefined && snapshot !== savedSnapshot;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Fill the form once per profile; later refetches (after a save) must not
  // overwrite what the user is typing
  useEffect(() => {
    if (!profile || loadedFor.current === profile.id) return;
    loadedFor.current = profile.id;
    const loaded = {
      name: profile.name ?? "",
      bio: profile.bio ?? "",
      handles: Object.fromEntries(
        (profile.socialLinks as SocialLink[]).map((link) => [link.network, link.handle])
      ),
      showcases: {
        allTime: profile.allTime,
        platinums: profile.platinums,
        collection: profile.collection,
      },
    };
    setName(loaded.name);
    setBio(loaded.bio);
    setHandles(loaded.handles);
    setShowcases(loaded.showcases);
    setSavedSnapshot(formSnapshot(loaded.name, loaded.bio, loaded.handles, loaded.showcases));
  }, [profile]);

  if (!isLoaded || (isSignedIn && (loading || !profile))) {
    return (
      <div className={styles.container}>
        <PageSkeleton variant="rows" label="Loading your profile" />
      </div>
    );
  }
  if (!isSignedIn || !profile || !supabaseId) return <RedirectToSignIn />;

  const candidates: Partial<Record<ShowcaseKey, ShowcaseGame[]>> = {
    platinums: platinumData?.myShowcaseCandidates ?? [],
    collection: collectionData?.myShowcaseCandidates ?? [],
  };

  const saveAvatar = async (avatarPath: string | null) => {
    const { data: result } = await updateProfile({ variables: { input: { avatarPath } } });
    if (!result?.updateMyProfile.success) {
      throw new Error(getMutationMessage(result?.updateMyProfile.error));
    }
  };

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return;
    setAvatarError(undefined);
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Use a JPEG, PNG or WebP image.");
      return;
    }
    setAvatarBusy(true);
    try {
      const blob = await toAvatarBlob(file);
      const path = `${supabaseId}/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await getSupabaseBrowserClient()
        .storage.from("avatars")
        .upload(path, blob, { contentType: "image/webp" });
      if (uploadError) throw new Error(uploadError.message);
      await saveAvatar(path);
      toast.success("Profile picture updated");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't upload that picture");
    } finally {
      setAvatarBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(undefined);
    setAvatarBusy(true);
    try {
      await saveAvatar(null);
      toast.success("Profile picture removed");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't remove your picture");
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      const { data: result } = await updateProfile({
        variables: {
          input: {
            name,
            bio,
            socialLinks: SOCIAL_NETWORKS.map(({ network }) => ({
              network,
              handle: handles[network] ?? "",
            })),
          },
        },
      });
      if (!result?.updateMyProfile.success) {
        throw new Error(getMutationMessage(result?.updateMyProfile.error));
      }
      await Promise.all(
        SHOWCASE_LISTS.map(async ({ list, key, title }) => {
          const { data: listResult } = await setShowcase({
            variables: { list, gameFamilyIds: showcases[key].map((game) => game.id) },
          });
          if (!listResult?.setProfileShowcase.success) {
            throw new Error(`${title}: ${getMutationMessage(listResult?.setProfileShowcase.error)}`);
          }
        })
      );
      setSavedSnapshot(snapshot);
      toast.success("Profile saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Edit Profile</h1>
        <Button variant="secondary" size="sm" href={`/users/${profile.id}`}>
          View profile
        </Button>
      </div>

      <form onSubmit={handleSave}>
        <section className={styles.panel} aria-labelledby="profile-heading">
          <h2 id="profile-heading" className={styles.groupTitle}>
            Profile
          </h2>
          <div className={styles.profileGrid}>
            <div className={styles.avatarColumn}>
              <span
                className={styles.avatar}
                style={{ backgroundColor: getAvatarColor(profile.name, profile.id) }}
              >
                <AppImage
                  src={profile.avatarUrl}
                  alt="Your profile picture"
                  fallback={<span className={styles.initials}>{getInitials(profile.name, profile.id)}</span>}
                />
              </span>
              <input
                ref={fileInput}
                type="file"
                accept={AVATAR_TYPES.join(",")}
                className="sr-only"
                id="avatar-file"
                onChange={(e) => handleAvatarFile(e.target.files?.[0])}
              />
              <div className={styles.avatarActions}>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={avatarBusy}
                  onClick={() => fileInput.current?.click()}
                >
                  {profile.avatarUrl ? "Change" : "Upload picture"}
                </Button>
                {profile.avatarUrl && (
                  <Button variant="ghost" size="sm" disabled={avatarBusy} onClick={handleRemoveAvatar}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <div className={styles.fields}>
              <FormField label="Display name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={NAME_MAX_LENGTH}
                  autoComplete="nickname"
                  disabled={saving}
                />
              </FormField>
              <FormField label="Bio" hint={`${bio.length}/${BIO_MAX_LENGTH}`}>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={BIO_MAX_LENGTH}
                  rows={4}
                  disabled={saving}
                />
              </FormField>
            </div>
          </div>
          {avatarError && <FormAlert message={avatarError} />}
        </section>

        <section className={styles.panel} aria-labelledby="social-heading">
          <h2 id="social-heading" className={styles.groupTitle}>
            Social networks
          </h2>
          <div className={styles.socialGrid}>
            {SOCIAL_NETWORKS.map(({ network, label, placeholder }) => (
              <label key={network} className={styles.socialField}>
                <span className={styles.socialLabel}>{label}</span>
                <input
                  className={styles.socialInput}
                  value={handles[network] ?? ""}
                  onChange={(e) => setHandles({ ...handles, [network]: e.target.value })}
                  placeholder={placeholder}
                  maxLength={64}
                  disabled={saving}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </label>
            ))}
          </div>
        </section>

        <section className={styles.panel} aria-label="Pinned games">
          {SHOWCASE_LISTS.map(({ key, title }) => (
            <ShowcaseEditor
              key={key}
              title={title}
              games={showcases[key]}
              onChange={(games) => setShowcases({ ...showcases, [key]: games })}
              candidates={candidates[key]}
              emptyCandidatesText={EMPTY_CANDIDATES[key]}
              disabled={saving}
            />
          ))}
        </section>

        <div className={styles.saveBar}>
          <div className={styles.saveBarInner}>
            {error ? (
              <FormAlert message={error} />
            ) : (
              <span className={styles.saveStatus} aria-live="polite">
                {dirty ? "Unsaved changes" : "All changes saved"}
              </span>
            )}
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save profile
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
