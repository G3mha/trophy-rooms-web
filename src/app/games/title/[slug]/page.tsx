"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ArrowLeft, Gamepad2, Layers3, Monitor, Star, Trophy } from "lucide-react";
import { handlePlatformIconError } from "@/lib/image-utils";
import { GET_GAMES_BY_TITLE } from "@/graphql/queries";
import { AppImage, Button, EmptyState, QueryState } from "@/components";
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
      <QueryState
        isLoading={loading}
        loadingText="Loading game..."
        error={error}
        errorTitle="Couldn’t load this game family"
        errorAction={
          <Button href="/games" variant="secondary">
            Back to Games
          </Button>
        }
        isEmpty={!loading && games.length === 0}
        emptyState={
          <>
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
          </>
        }
      >
        <Link href="/games" className={styles.backLink}>
          <ArrowLeft size={16} />
          Back to Games
        </Link>

        <header className={styles.hero}>
          <div className={styles.coverCard}>
            <AppImage
              src={coverUrl}
              alt={displayTitle}
              className={styles.cover}
              fallback={
                <div className={styles.coverPlaceholder}>
                  <Gamepad2 size={64} />
                </div>
              }
            />
          </div>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <Layers3 size={14} />
              <span>Game Family</span>
            </div>
            <h1 className={styles.title}>{displayTitle}</h1>
            <p className={styles.subtitle}>
              Compare platform variants, achievement totals, and trophy support for this title group.
            </p>
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{games.length}</span>
                <span className={styles.statLabel}>Platform Versions</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{totalAchievements}</span>
                <span className={styles.statLabel}>Total Achievements</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statValue}>{totalTrophies}</span>
                <span className={styles.statLabel}>Total Trophies</span>
              </div>
            </div>
            <div className={styles.platformCount}>
              <Monitor size={16} />
              <span>Available across {games.length} tracked platforms</span>
            </div>
          </div>
        </header>

        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Variants</p>
              <h2 className={styles.sectionTitle}>Platform Versions</h2>
            </div>
            <span className={styles.countPill}>{games.length}</span>
          </div>
          <div className={styles.versionsList}>
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className={styles.versionCard}
              >
                <div className={styles.platformInfo}>
                  {game.platform && (
                    <AppImage
                      src={`/platforms/${game.platform.slug}.svg`}
                      alt={game.platform.name}
                      className={styles.platformIcon}
                      onError={handlePlatformIconError}
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
      </QueryState>
    </div>
  );
}
