"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { FilePlus2, Gamepad2, ImageIcon, Lock } from "lucide-react";
import { CREATE_GAME } from "@/graphql/mutations";
import { GET_GAMES, GET_ME } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import { Button, LoadingSpinner, EmptyState, FormAlert } from "@/components";
import { CoverPreview } from "@/components/admin";
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
  const [platformId, setPlatformId] = useState("");
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

  const [createGame, { loading }] = useMutation(CREATE_GAME, {
    refetchQueries: [{ query: GET_GAMES, variables: { first: 12 } }],
    onCompleted: (data) => {
      if (data.createGame.success) {
        toast.success("Game created successfully.");
        router.push(`/games/${data.createGame.game.id}`);
      } else {
        const errorMsg = data.createGame.error?.message || "Failed to create game";
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

    await createGame({
      variables: {
        input: {
          title: title.trim(),
          description: description.trim() || null,
          coverUrl: coverUrl.trim() || null,
          platformId: platformId || null,
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
            <span>{platforms.length} platforms available</span>
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
            <label htmlFor="platformId" className={styles.label}>
              Platform
            </label>
            <select
              id="platformId"
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              className={styles.select}
            >
              <option value="">No platform</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
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
