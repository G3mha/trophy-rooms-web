"use client";

import { use, useMemo } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import {
  GET_USER,
  GET_USER_ACHIEVEMENTS,
  GET_USER_TROPHIES,
} from "@/graphql/queries";
import { LoadingSpinner, EmptyState, Button, ProfileHeader, RecentActivity } from "@/components";
import type { AchievementTier } from "@/components/AchievementCard";
import styles from "./page.module.css";

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  points?: number;
  tier?: AchievementTier;
}

interface UserAchievementNode {
  id: string;
  createdAt: string;
  achievement: Achievement & {
    achievementSet: {
      id: string;
      title: string;
      game: {
        id: string;
        title: string;
      };
    };
  };
}

interface TrophyNode {
  id: string;
  createdAt: string;
  game: {
    id: string;
    title: string;
    coverUrl?: string | null;
  };
}

interface GameProgress {
  gameId: string;
  gameTitle: string;
  achievements: Achievement[];
  totalPoints: number;
  earnedAt: string;
  hasTrophy: boolean;
  trophyEarnedAt?: string;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: userData, loading: userLoading, error: userError } = useQuery(
    GET_USER,
    {
      variables: { id },
    }
  );

  const { data: achievementsData, loading: achievementsLoading } = useQuery(
    GET_USER_ACHIEVEMENTS,
    {
      variables: { userId: id, first: 1000 },
    }
  );

  const { data: trophiesData, loading: trophiesLoading } = useQuery(
    GET_USER_TROPHIES,
    {
      variables: { userId: id, first: 100 },
    }
  );

  // Group achievements by game
  const gameProgressList = useMemo(() => {
    if (!achievementsData?.userAchievements?.edges) return [];

    const trophyMap = new Map<string, string>();
    trophiesData?.userTrophies?.edges?.forEach(
      ({ node }: { node: TrophyNode }) => {
        trophyMap.set(node.game.id, node.createdAt);
      }
    );

    const gameMap = new Map<string, GameProgress>();

    achievementsData.userAchievements.edges.forEach(
      ({ node }: { node: UserAchievementNode }) => {
        const gameId = node.achievement.achievementSet.game.id;
        const gameTitle = node.achievement.achievementSet.game.title;

        if (!gameMap.has(gameId)) {
          gameMap.set(gameId, {
            gameId,
            gameTitle,
            achievements: [],
            totalPoints: 0,
            earnedAt: node.createdAt,
            hasTrophy: trophyMap.has(gameId),
            trophyEarnedAt: trophyMap.get(gameId),
          });
        }

        const game = gameMap.get(gameId)!;
        game.achievements.push({
          id: node.achievement.id,
          title: node.achievement.title,
          description: node.achievement.description,
          iconUrl: node.achievement.iconUrl,
          points: node.achievement.points,
          tier: node.achievement.tier,
        });
        game.totalPoints += node.achievement.points || 0;

        if (new Date(node.createdAt) > new Date(game.earnedAt)) {
          game.earnedAt = node.createdAt;
        }
      }
    );

    return Array.from(gameMap.values()).sort((a, b) => {
      if (a.hasTrophy && !b.hasTrophy) return -1;
      if (!a.hasTrophy && b.hasTrophy) return 1;
      return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime();
    });
  }, [achievementsData, trophiesData]);

  // Calculate tier counts
  const tierCounts = useMemo(() => {
    const counts = { GOLD: 0, SILVER: 0, BRONZE: 0 };
    gameProgressList.forEach((game) => {
      game.achievements.forEach((a) => {
        const tier = a.tier || "BRONZE";
        counts[tier]++;
      });
    });
    return counts;
  }, [gameProgressList]);

  const loading = userLoading || achievementsLoading || trophiesLoading;
  const user = userData?.user;
  const trophyCount = trophiesData?.userTrophies?.totalCount || 0;
  const totalPoints = gameProgressList.reduce(
    (sum, g) => sum + g.totalPoints,
    0
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading trophy room..." />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon="👤"
          title="User not found"
          description="This user doesn't exist or their profile is not available."
          action={<Button href="/games">Browse Games</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Profile Header */}
      <ProfileHeader
        name={user.name}
        email={user.email}
        memberSince={user.createdAt || new Date().toISOString()}
        achievementCount={user.achievementCount || 0}
        trophyCount={trophyCount}
        gamesPlayed={gameProgressList.length}
        stats={user.stats}
      />

      {/* Recent Activity */}
      {user.recentAchievements && user.recentAchievements.length > 0 && (
        <section className={styles.activitySection}>
          <RecentActivity achievements={user.recentAchievements} />
        </section>
      )}

      {/* Trophy Showcase */}
      {trophyCount > 0 && (
        <section className={styles.trophyShowcase}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.crimsonIcon}>🏆</span> Crimson Trophy
            Collection
          </h2>
          <p className={styles.sectionSubtitle}>
            100% completion achieved in these games
          </p>
          <div className={styles.trophyGrid}>
            {gameProgressList
              .filter((g) => g.hasTrophy)
              .map((game) => (
                <Link
                  key={game.gameId}
                  href={`/games/${game.gameId}`}
                  className={styles.trophyCard}
                >
                  <div className={styles.trophyIconLarge}>🏆</div>
                  <div className={styles.trophyDetails}>
                    <h3 className={styles.trophyGameTitle}>{game.gameTitle}</h3>
                    <p className={styles.trophyMeta}>
                      {game.achievements.length} achievements ·{" "}
                      {game.totalPoints} pts
                    </p>
                    <p className={styles.trophyDate}>
                      Completed{" "}
                      {new Date(game.trophyEarnedAt!).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Games Section */}
      <section className={styles.gamesSection}>
        <h2 className={styles.sectionTitle}>Achievement Collection</h2>
        <p className={styles.sectionSubtitle}>
          All earned achievements organized by game
        </p>

        {gameProgressList.length > 0 ? (
          <div className={styles.gamesList}>
            {gameProgressList.map((game) => (
              <div
                key={game.gameId}
                className={`${styles.gameCard} ${
                  game.hasTrophy ? styles.gameCardCompleted : ""
                }`}
              >
                <div className={styles.gameHeader}>
                  <Link
                    href={`/games/${game.gameId}`}
                    className={styles.gameLink}
                  >
                    <h3 className={styles.gameTitle}>
                      {game.hasTrophy && (
                        <span className={styles.trophyBadge}>🏆</span>
                      )}
                      {game.gameTitle}
                    </h3>
                  </Link>
                  <div className={styles.gameStats}>
                    <span className={styles.achievementCount}>
                      {game.achievements.length} achievements
                    </span>
                    <span className={styles.pointsCount}>
                      {game.totalPoints} pts
                    </span>
                  </div>
                </div>

                <div className={styles.achievementsGrid}>
                  {game.achievements
                    .sort((a, b) => {
                      const tierOrder = { GOLD: 0, SILVER: 1, BRONZE: 2 };
                      return (
                        (tierOrder[a.tier || "BRONZE"] || 2) -
                        (tierOrder[b.tier || "BRONZE"] || 2)
                      );
                    })
                    .map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`${styles.achievementPill} ${
                          styles[`tier${achievement.tier || "BRONZE"}`]
                        }`}
                        title={achievement.description || achievement.title}
                      >
                        <span className={styles.achievementIcon}>
                          {achievement.tier === "GOLD"
                            ? "🥇"
                            : achievement.tier === "SILVER"
                              ? "🥈"
                              : "🥉"}
                        </span>
                        <span className={styles.achievementName}>
                          {achievement.title}
                        </span>
                        {achievement.points && achievement.points > 0 && (
                          <span className={styles.achievementPoints}>
                            {achievement.points}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🎮"
            title="No achievements yet"
            description="This user hasn't earned any achievements yet."
          />
        )}
      </section>
    </div>
  );
}
