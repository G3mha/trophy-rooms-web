"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { FilePlus2, Gamepad2, ImageIcon, Lock } from "lucide-react";
import { CREATE_GAME_FAMILY } from "@/graphql/mutations";
import { GET_GAMES, GET_ME } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import { Button, LoadingSpinner, EmptyState, FormAlert } from "@/components";
import { CoverPreview } from "@/components/admin";
import { generateSlug } from "@/lib/slug-utils";
import styles from "./page.module.css";

interface Platform {
  id: string;
  name: string;
}

export default function NewGamePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [platformIds, setPlatformIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { data: meData, loading: meLoading } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });

  const { data: platformsData } = useQuery(GET_PLATFORMS, {
    skip: !isSignedIn,
  });
  const platforms: Platform[] = platformsData?.platforms ?? [];

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";

  const [createGameFamily, { loading }] = useMutation(CREATE_GAME_FAMILY, {
    refetchQueries: [{ query: GET_GAMES, variables: { first: 12 } }],
    onCompleted: (data) => {
      if (data.createGameFamily.success) {
        const trimmedTitle = title.trim();
        const count = platformIds.size;
        toast.success(
          count > 1
            ? `Created ${trimmedTitle} for ${count} platforms.`
            : "Game created successfully."
        );
        router.push(`/games/title/${encodeURIComponent(generateSlug(trimmedTitle))}`);
      } else {
        const errorMsg = data.createGameFamily.error?.message || "Failed to create game";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    },
    onError: (err) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (platformIds.size === 0) {
      setError("Select at least one platform.");
      return;
    }

    await createGameFamily({
      variables: {
        input: {
          title: title.trim(),
          description: description.trim() || null,
          coverUrl: coverUrl.trim() || null,
          platformIds: Array.from(platformIds),
        },
      },
    });
  };

  if (!isLoaded) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (meLoading) {
    return <LoadingSpinner text="Checking access..." />;
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon={<Lock size={48} />}
          title="Admin Access Required"
          description="You don't have permission to add games yet."
          action={<Button href="/games">Back to Games</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <FilePlus2 size={14} />
            <span>Catalog Admin</span>
          </div>
          <h1 className={styles.title}>Add New Game</h1>
          <p className={styles.subtitle}>
            Create a new library entry with its platform context, cover art, and base description.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <Gamepad2 size={16} />
            <span>
              {platformIds.size > 0
                ? `${platformIds.size} selected`
                : `${platforms.length} platforms available`}
            </span>
          </div>
          <div className={styles.heroStat}>
            <ImageIcon size={16} />
            <span>Cover preview updates live</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.formPanel}>
        <div className={styles.formHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Entry Setup</p>
            <h2 className={styles.formTitle}>Core Metadata</h2>
          </div>
        </div>

        {error && <FormAlert message={error} className={styles.formAlert} />}

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              Game Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Legend of Zelda: Tears of the Kingdom"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Platforms *
            </label>
            <div className={styles.checkboxList}>
              {platforms.map((platform) => (
                <label key={platform.id} className={styles.checkboxOption}>
                  <input
                    type="checkbox"
                    checked={platformIds.has(platform.id)}
                    onChange={(e) => {
                      const next = new Set(platformIds);
                      if (e.target.checked) {
                        next.add(platform.id);
                      } else {
                        next.delete(platform.id);
                      }
                      setPlatformIds(next);
                    }}
                  />
                  <span className={styles.checkboxOptionText}>{platform.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of the game..."
            className={styles.textarea}
            rows={4}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="coverUrl" className={styles.label}>
            Cover Image URL
          </label>
          <input
            id="coverUrl"
            type="url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://example.com/game-cover.jpg"
            className={styles.input}
          />
          {coverUrl && <CoverPreview url={coverUrl.trim()} alt="Cover preview" />}
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Game
          </Button>
        </div>
      </form>
    </div>
  );
}
