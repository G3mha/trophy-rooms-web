"use client";

import { use, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { GET_GAME } from "@/graphql/queries";
import { MARK_ACHIEVEMENT_COMPLETE, UNMARK_ACHIEVEMENT_COMPLETE } from "@/graphql/mutations";
import { AchievementCard, Button, LoadingSpinner, EmptyState } from "@/components";
import styles from "./page.module.css";

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  isCompleted?: boolean;
  userCount: number;
}

interface Trophy {
  id: string;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

interface Game {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
  achievements: Achievement[];
  trophies: Trophy[];
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_GAME, {
    variables: { id },
  });

  const [markComplete] = useMutation(MARK_ACHIEVEMENT_COMPLETE, {
    onCompleted: () => {
      refetch();
      setTogglingId(null);
    },
    onError: () => setTogglingId(null),
  });

  const [unmarkComplete] = useMutation(UNMARK_ACHIEVEMENT_COMPLETE, {
    onCompleted: () => {
      refetch();
      setTogglingId(null);
    },
    onError: () => setTogglingId(null),
  });

  const handleToggleAchievement = async (achievementId: string) => {
    if (!isSignedIn) return;

    setTogglingId(achievementId);
    const achievement = game?.achievements.find((a: Achievement) => a.id === achievementId);

    if (achievement?.isCompleted) {
      await unmarkComplete({ variables: { achievementId } });
    } else {
      await markComplete({ variables: { achievementId } });
    }
  };

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

  const game: Game = data?.game;

  if (!game) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon="🎮"
          title="Game not found"
          description="This game doesn't exist or has been removed."
          action={
            <Button href="/games">Back to Games</Button>
          }
        />
      </div>
    );
  }

  const completedCount = game.achievements.filter((a: Achievement) => a.isCompleted).length;
  const progress = game.achievementCount > 0
    ? Math.round((completedCount / game.achievementCount) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {/* Game Header */}
      <header className={styles.header}>
        <div className={styles.coverContainer}>
          {game.coverUrl ? (
            <img src={game.coverUrl} alt={game.title} className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder}>
              <span>🎮</span>
            </div>
          )}
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{game.title}</h1>
          {game.description && (
            <p className={styles.description}>{game.description}</p>
          )}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{game.achievementCount}</span>
              <span className={styles.statLabel}>Achievements</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{game.trophyCount}</span>
              <span className={styles.statLabel}>Trophies Earned</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isSignedIn && game.achievementCount > 0 && (
        <section className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Your Progress</span>
            <span className={styles.progressValue}>
              {completedCount} / {game.achievementCount} ({progress}%)
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className={styles.trophyEarned}>
              <span>🏆</span> Trophy Earned!
            </div>
          )}
        </section>
      )}

      {/* Achievements */}
      <section className={styles.achievementsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Achievements</h2>
        </div>

        {game.achievements.length > 0 ? (
          <div className={styles.achievementList}>
            {game.achievements.map((achievement: Achievement) => (
              <AchievementCard
                key={achievement.id}
                id={achievement.id}
                title={achievement.title}
                description={achievement.description}
                iconUrl={achievement.iconUrl}
                isCompleted={achievement.isCompleted}
                userCount={achievement.userCount}
                onToggle={isSignedIn ? handleToggleAchievement : undefined}
                loading={togglingId === achievement.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="⭐"
            title="No achievements yet"
            description="This game doesn't have any achievements defined yet."
          />
        )}
      </section>

      {/* Trophy Holders */}
      {game.trophies.length > 0 && (
        <section className={styles.trophySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Trophy Holders</h2>
          </div>
          <div className={styles.trophyHolders}>
            {game.trophies.map((trophy: Trophy) => (
              <div key={trophy.id} className={styles.trophyHolder}>
                <div className={styles.trophyIcon}>🏆</div>
                <div className={styles.trophyInfo}>
                  <span className={styles.trophyName}>
                    {trophy.user.name || trophy.user.email}
                  </span>
                  <span className={styles.trophyDate}>
                    {new Date(trophy.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
