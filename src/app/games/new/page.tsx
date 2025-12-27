"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { CREATE_GAME } from "@/graphql/mutations";
import { GET_GAMES } from "@/graphql/queries";
import { Button, LoadingSpinner } from "@/components";
import styles from "./page.module.css";

export default function NewGamePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [createGame, { loading }] = useMutation(CREATE_GAME, {
    refetchQueries: [{ query: GET_GAMES, variables: { first: 12 } }],
    onCompleted: (data) => {
      if (data.createGame.success) {
        router.push(`/games/${data.createGame.game.id}`);
      } else {
        setError(data.createGame.error?.message || "Failed to create game");
      }
    },
    onError: (err) => {
      setError(err.message);
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Add New Game</h1>
        <p className={styles.subtitle}>
          Add a Nintendo Switch game to the library
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

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
          {coverUrl && (
            <div className={styles.preview}>
              <img src={coverUrl} alt="Cover preview" className={styles.previewImage} />
            </div>
          )}
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
