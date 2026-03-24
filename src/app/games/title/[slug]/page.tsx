"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ArrowLeft, Gamepad2, Star, Trophy } from "lucide-react";
import { GET_GAMES_BY_TITLE } from "@/graphql/queries";
import { LoadingSpinner, Button, EmptyState } from "@/components";
import styles from "./page.module.css";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface Game {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
  platform?: Platform | null;
}

export default function GameFamilyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  // Decode the slug back to title
  const title = decodeURIComponent(slug.replace(/-/g, " "));

  const { data, loading, error } = useQuery(GET_GAMES_BY_TITLE, {
    variables: { title },
  });

  const games: Game[] = data?.gamesByTitle || [];

  // Calculate totals
  const totalAchievements = games.reduce((sum, g) => sum + g.achievementCount, 0);
  const totalTrophies = games.reduce((sum, g) => sum + g.trophyCount, 0);
  const coverUrl = games.find((g) => g.coverUrl)?.coverUrl ?? null;
  const displayTitle = games[0]?.title ?? title;

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading game..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error loading game: {error.message}</p>
          <Button href="/games" variant="secondary">
            Back to Games
          </Button>
        </div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className={styles.container}>
        <Link href="/games" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Games
        </Link>
        <EmptyState
          icon={<Gamepad2 size={48} />}
          title="Game not found"
          description="We couldn't find any games matching this title."
          action={
            <Button href="/games" variant="secondary">
              Browse Games
            </Button>
          }
        />
      </div>
    );
  }

  // If there's only one version, redirect to that game's page
  if (games.length === 1) {
    return (
      <div className={styles.container}>
        <Link href="/games" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Games
        </Link>
        <EmptyState
          icon={<Gamepad2 size={48} />}
          title="Single version found"
          description="This game only exists on one platform."
          action={
            <Button href={`/games/${games[0].id}`}>View Game</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/games" className={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Games
      </Link>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.coverContainer}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={displayTitle}
              className={styles.cover}
            />
          ) : (
            <div className={styles.coverPlaceholder}>
              <Gamepad2 size={64} />
            </div>
          )}
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{displayTitle}</h1>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalAchievements}</span>
              <span className={styles.statLabel}>Total Achievements</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalTrophies}</span>
              <span className={styles.statLabel}>Total Trophies</span>
            </div>
          </div>
          <p className={styles.platformCount}>
            Available on {games.length} platforms
          </p>
        </div>
      </header>

      {/* Platform Versions */}
      <section className={styles.versionsSection}>
        <h2 className={styles.sectionTitle}>Platform Versions</h2>
        <div className={styles.versionsList}>
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className={styles.versionCard}
            >
              <div className={styles.platformInfo}>
                {game.platform && (
                  <img
                    src={`/platforms/${game.platform.slug}.svg`}
                    alt={game.platform.name}
                    className={styles.platformIcon}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span className={styles.platformName}>
                  {game.platform?.name ?? "Unknown Platform"}
                </span>
              </div>
              <div className={styles.versionStats}>
                <div className={styles.versionStat}>
                  <Star size={16} className={styles.versionStatIcon} />
                  <span>{game.achievementCount} achievements</span>
                </div>
                {game.trophyCount > 0 && (
                  <div className={styles.versionStat}>
                    <Trophy size={16} className={styles.versionStatIcon} />
                    <span>{game.trophyCount} trophies</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
