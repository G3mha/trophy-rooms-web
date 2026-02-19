"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { GET_GAME, GET_ME } from "@/graphql/queries";
import {
  MARK_ACHIEVEMENT_COMPLETE,
  UNMARK_ACHIEVEMENT_COMPLETE,
  CREATE_ACHIEVEMENT_SET,
  CREATE_ACHIEVEMENT,
  PUBLISH_ACHIEVEMENT_SET,
} from "@/graphql/mutations";
import { AchievementCard, Button, LoadingSpinner, EmptyState, WishlistButton } from "@/components";
import type { AchievementTier } from "@/components/AchievementCard";
import styles from "./page.module.css";

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  points?: number;
  tier?: AchievementTier;
  isCompleted?: boolean;
  userCount: number;
  achievementSetId: string;
}

// Tier sort priority (higher = more rare = shown first)
const tierPriority: Record<AchievementTier, number> = {
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

function sortByTier(achievements: Achievement[]): Achievement[] {
  return [...achievements].sort((a, b) => {
    const aTier = a.tier ?? "BRONZE";
    const bTier = b.tier ?? "BRONZE";
    return tierPriority[bTier] - tierPriority[aTier];
  });
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

interface AchievementSet {
  id: string;
  title: string;
  type: "OFFICIAL" | "COMPLETIONIST" | "CUSTOM";
  visibility: "PRIVATE" | "PUBLIC";
  createdByUserId?: string | null;
  achievements: Achievement[];
}

interface Game {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
  achievementSets: AchievementSet[];
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
  const [newSetTitle, setNewSetTitle] = useState("");
  const [setError, setSetError] = useState<string | null>(null);
  const [achievementSetId, setAchievementSetId] = useState("");
  const [achievementTitle, setAchievementTitle] = useState("");
  const [achievementDescription, setAchievementDescription] = useState("");
  const [achievementPoints, setAchievementPoints] = useState("0");
  const [achievementIconUrl, setAchievementIconUrl] = useState("");
  const [achievementError, setAchievementError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_GAME, {
    variables: { id },
  });

  const { data: meData } = useQuery(GET_ME, {
    skip: !isSignedIn,
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

  const [createAchievementSet, { loading: creatingSet }] = useMutation(
    CREATE_ACHIEVEMENT_SET,
    {
      onCompleted: (result) => {
        if (result.createAchievementSet.success) {
          setNewSetTitle("");
          setSetError(null);
          refetch();
        } else {
          setSetError(
            result.createAchievementSet.error?.message ||
              "Failed to create achievement set"
          );
        }
      },
      onError: (err) => setSetError(err.message),
    }
  );

  const [createAchievement, { loading: creatingAchievement }] = useMutation(
    CREATE_ACHIEVEMENT,
    {
      onCompleted: (result) => {
        if (result.createAchievement.success) {
          setAchievementTitle("");
          setAchievementDescription("");
          setAchievementPoints("0");
          setAchievementIconUrl("");
          setAchievementError(null);
          refetch();
        } else {
          setAchievementError(
            result.createAchievement.error?.message ||
              "Failed to create achievement"
          );
        }
      },
      onError: (err) => setAchievementError(err.message),
    }
  );

  const [publishAchievementSet, { loading: publishingSet }] = useMutation(
    PUBLISH_ACHIEVEMENT_SET,
    {
      onCompleted: () => refetch(),
    }
  );

  const game: Game | undefined = data?.game;
  const me = meData?.me;

  // Compute owned custom sets for useEffect dependency
  const ownedCustomSets = game?.achievementSets.filter(
    (set) => set.type === "CUSTOM" && set.createdByUserId === me?.id
  ) ?? [];

  // Set default achievement set - must be before any conditional returns
  useEffect(() => {
    if (!achievementSetId && ownedCustomSets.length > 0) {
      setAchievementSetId(ownedCustomSets[0].id);
    }
  }, [achievementSetId, ownedCustomSets]);

  const handleToggleAchievement = async (achievementId: string) => {
    if (!isSignedIn) return;

    setTogglingId(achievementId);
    const achievement = game?.achievementSets
      .flatMap((set) => set.achievements)
      .find((a: Achievement) => a.id === achievementId);

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

  const allAchievements = game.achievementSets.flatMap((set) => set.achievements);
  const completedCount = allAchievements.filter((a: Achievement) => a.isCompleted).length;
  const totalCount = allAchievements.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate total players for rarity (max userCount across all achievements)
  const totalPlayers = allAchievements.length > 0
    ? Math.max(...allAchievements.map((a) => a.userCount))
    : 0;

  const handleCreateCustomSet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetError(null);

    if (!newSetTitle.trim()) {
      setSetError("Title is required");
      return;
    }

    await createAchievementSet({
      variables: {
        input: {
          title: newSetTitle.trim(),
          type: "CUSTOM",
          gameId: id,
        },
      },
    });
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAchievementError(null);

    if (!achievementSetId) {
      setAchievementError("Select a custom set");
      return;
    }

    if (!achievementTitle.trim()) {
      setAchievementError("Title is required");
      return;
    }

    const points = Number.parseInt(achievementPoints, 10);

    await createAchievement({
      variables: {
        input: {
          title: achievementTitle.trim(),
          description: achievementDescription.trim() || null,
          iconUrl: achievementIconUrl.trim() || null,
          points: Number.isFinite(points) ? points : 0,
          achievementSetId,
        },
      },
    });
  };

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
              <span className={styles.statValue}>{totalCount}</span>
              <span className={styles.statLabel}>Achievements</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{game.trophyCount}</span>
              <span className={styles.statLabel}>Trophies Earned</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <WishlistButton gameId={id} />
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {isSignedIn && totalCount > 0 && (
        <section className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={styles.progressLabel}>Your Progress</span>
            <span className={styles.progressValue}>
              {completedCount} / {totalCount} ({progress}%)
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          {progress === 100 && (
            <div className={styles.crimsonTrophy}>
              <div className={styles.crimsonIcon}>🏆</div>
              <div className={styles.crimsonContent}>
                <span className={styles.crimsonTitle}>Crimson Trophy Earned!</span>
                <span className={styles.crimsonSubtitle}>100% Completion Achieved</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Achievement Sets */}
      <section className={styles.achievementsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Achievement Sets</h2>
        </div>

        {game.achievementSets.length > 0 ? (
          <div className={styles.achievementList}>
            {game.achievementSets.map((set) => (
              <div key={set.id} className={styles.setCard}>
                <div className={styles.setHeader}>
                  <div>
                    <h3 className={styles.setTitle}>{set.title}</h3>
                    <p className={styles.setMeta}>
                      {set.type} · {set.visibility.toLowerCase()}
                    </p>
                  </div>
                  {isSignedIn &&
                    set.type === "CUSTOM" &&
                    set.createdByUserId === me?.id &&
                    set.visibility === "PRIVATE" && (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          publishAchievementSet({ variables: { id: set.id } })
                        }
                        loading={publishingSet}
                      >
                        Publish
                      </Button>
                    )}
                </div>

                {set.achievements.length > 0 ? (
                  <div className={styles.achievementList}>
                    {sortByTier(set.achievements).map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        id={achievement.id}
                        title={achievement.title}
                        description={achievement.description}
                        iconUrl={achievement.iconUrl}
                        points={achievement.points}
                        tier={achievement.tier}
                        isCompleted={achievement.isCompleted}
                        userCount={achievement.userCount}
                        totalPlayers={totalPlayers}
                        onToggle={isSignedIn ? handleToggleAchievement : undefined}
                        loading={togglingId === achievement.id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="⭐"
                    title="No achievements yet"
                    description="Add achievements to this set."
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="⭐"
            title="No achievement sets yet"
            description="This game doesn't have any achievement sets defined yet."
          />
        )}
      </section>

      {isSignedIn && (
        <section className={styles.createSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Create Your Custom Set</h2>
          </div>

          <form onSubmit={handleCreateCustomSet} className={styles.form}>
            {setError && (
              <div className={styles.error}>
                <p>{setError}</p>
              </div>
            )}
            <div className={styles.field}>
              <label htmlFor="setTitle" className={styles.label}>
                Set Title
              </label>
              <input
                id="setTitle"
                type="text"
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                className={styles.input}
                placeholder="e.g. Speedrunner Challenges"
              />
            </div>
            <Button type="submit" loading={creatingSet}>
              Create Custom Set
            </Button>
          </form>

          {ownedCustomSets.length > 0 && (
            <div className={styles.subSection}>
              <h3 className={styles.subTitle}>Add Achievements</h3>
              <form onSubmit={handleCreateAchievement} className={styles.form}>
                {achievementError && (
                  <div className={styles.error}>
                    <p>{achievementError}</p>
                  </div>
                )}
                <div className={styles.field}>
                  <label htmlFor="achievementSet" className={styles.label}>
                    Custom Set
                  </label>
                  <select
                    id="achievementSet"
                    className={styles.select}
                    value={achievementSetId}
                    onChange={(e) => setAchievementSetId(e.target.value)}
                  >
                    <option value="">Select a set</option>
                    {ownedCustomSets.map((set) => (
                      <option key={set.id} value={set.id}>
                        {set.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="achievementTitle" className={styles.label}>
                    Achievement Title
                  </label>
                  <input
                    id="achievementTitle"
                    type="text"
                    value={achievementTitle}
                    onChange={(e) => setAchievementTitle(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="achievementDescription" className={styles.label}>
                    Description
                  </label>
                  <textarea
                    id="achievementDescription"
                    value={achievementDescription}
                    onChange={(e) => setAchievementDescription(e.target.value)}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="achievementPoints" className={styles.label}>
                    Points
                  </label>
                  <input
                    id="achievementPoints"
                    type="number"
                    min="0"
                    value={achievementPoints}
                    onChange={(e) => setAchievementPoints(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="achievementIconUrl" className={styles.label}>
                    Icon URL
                  </label>
                  <input
                    id="achievementIconUrl"
                    type="url"
                    value={achievementIconUrl}
                    onChange={(e) => setAchievementIconUrl(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <Button type="submit" loading={creatingAchievement}>
                  Add Achievement
                </Button>
              </form>
            </div>
          )}
        </section>
      )}

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
