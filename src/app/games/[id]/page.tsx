"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Gamepad2, Trophy, Star, Target, Calendar, Code2, Building2, ShieldAlert } from "lucide-react";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { GET_GAME, GET_ME } from "@/graphql/queries";
import {
  MARK_ACHIEVEMENT_COMPLETE,
  UNMARK_ACHIEVEMENT_COMPLETE,
  CREATE_ACHIEVEMENT_SET,
  CREATE_ACHIEVEMENT,
  PUBLISH_ACHIEVEMENT_SET,
} from "@/graphql/mutations";
import { AchievementCard, AppImage, Button, LoadingSpinner, EmptyState, GameStatusSelector, BuylistSelector, CollectionSelector, ExpandableText } from "@/components";
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

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface Game {
  id: string;
  gameFamilyId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  releaseDate?: string | null;
  developer?: string | null;
  publisher?: string | null;
  genre?: string | null;
  esrbRating?: string | null;
  screenshots: string[];
  platform?: Platform | null;
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
  const { setCurrentEntity, clearEntity } = useAdminMode();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newSetTitle, setNewSetTitle] = useState("");
  const [setError, setSetError] = useState<string | null>(null);
  const [achievementSetId, setAchievementSetId] = useState("");
  const [achievementTitle, setAchievementTitle] = useState("");
  const [achievementDescription, setAchievementDescription] = useState("");
  const [achievementPoints, setAchievementPoints] = useState("0");
  const [achievementIconUrl, setAchievementIconUrl] = useState("");
  const [achievementError, setAchievementError] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(null);

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
      toast.success("Achievement marked complete.");
    },
    onError: (error) => {
      setTogglingId(null);
      toast.error(error.message || "Failed to mark achievement.");
    },
  });

  const [unmarkComplete] = useMutation(UNMARK_ACHIEVEMENT_COMPLETE, {
    onCompleted: () => {
      refetch();
      setTogglingId(null);
      toast.success("Achievement unmarked.");
    },
    onError: (error) => {
      setTogglingId(null);
      toast.error(error.message || "Failed to unmark achievement.");
    },
  });

  const [createAchievementSet, { loading: creatingSet }] = useMutation(
    CREATE_ACHIEVEMENT_SET,
    {
      onCompleted: (result) => {
        if (result.createAchievementSet.success) {
          setNewSetTitle("");
          setSetError(null);
          refetch();
          toast.success("Achievement set created.");
        } else {
          const errorMsg = result.createAchievementSet.error?.message || "Failed to create achievement set";
          setSetError(errorMsg);
          toast.error(errorMsg);
        }
      },
      onError: (err) => {
        setSetError(err.message);
        toast.error(err.message);
      },
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
          toast.success("Achievement created.");
        } else {
          const errorMsg = result.createAchievement.error?.message || "Failed to create achievement";
          setAchievementError(errorMsg);
          toast.error(errorMsg);
        }
      },
      onError: (err) => {
        setAchievementError(err.message);
        toast.error(err.message);
      },
    }
  );

  const [publishAchievementSet, { loading: publishingSet }] = useMutation(
    PUBLISH_ACHIEVEMENT_SET,
    {
      onCompleted: () => {
        refetch();
        toast.success("Achievement set published.");
      },
      onError: (error) => toast.error(error.message || "Failed to publish achievement set."),
    }
  );

  const game: Game | undefined = data?.game;
  const me = meData?.me;

  // Compute owned custom sets for useEffect dependency
  const ownedCustomSets = useMemo(
    () =>
      game?.achievementSets.filter(
        (set) => set.type === "CUSTOM" && set.createdByUserId === me?.id
      ) ?? [],
    [game?.achievementSets, me?.id]
  );

  // Set default achievement set - must be before any conditional returns
  useEffect(() => {
    if (!achievementSetId && ownedCustomSets.length > 0) {
      setAchievementSetId(ownedCustomSets[0].id);
    }
  }, [achievementSetId, ownedCustomSets]);

  // Register current entity for admin toolbar
  useEffect(() => {
    if (game) {
      setCurrentEntity({
        type: "game",
        id: game.id,
        title: game.title,
        platformId: game.platform?.id,
        platformName: game.platform?.name,
        gameFamilyId: game.gameFamilyId,
      });
    }
    return () => clearEntity();
  }, [game, setCurrentEntity, clearEntity]);

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
          icon={<Gamepad2 size={48} />}
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
          <AppImage
            src={game.coverUrl}
            alt={game.title}
            className={styles.cover}
            fallback={
              <div className={styles.coverPlaceholder}>
                <Gamepad2 size={48} />
              </div>
            }
          />
        </div>
        <div className={styles.headerContent}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{game.title}</h1>
            {game.platform && (
              <span className={styles.platformBadge}>{game.platform.name}</span>
            )}
          </div>
          {game.description && (
            <ExpandableText text={game.description} maxLines={4} className={styles.description} />
          )}

          {/* Game Metadata */}
          <div className={styles.metadata}>
            {game.releaseDate && (
              <div className={styles.metaItem}>
                <Calendar className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Released</span>
                <span className={styles.metaValue}>
                  {new Date(game.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {game.developer && (
              <div className={styles.metaItem}>
                <Code2 className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Developer</span>
                <span className={styles.metaValue}>{game.developer}</span>
              </div>
            )}
            {game.publisher && (
              <div className={styles.metaItem}>
                <Building2 className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Publisher</span>
                <span className={styles.metaValue}>{game.publisher}</span>
              </div>
            )}
            {game.genre && (
              <div className={styles.metaItem}>
                <Target className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Genre</span>
                <span className={styles.metaValue}>{game.genre}</span>
              </div>
            )}
            {game.esrbRating && (
              <div className={styles.metaItem}>
                <ShieldAlert className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Rating</span>
                <span className={styles.metaValue}>{game.esrbRating}</span>
              </div>
            )}
          </div>

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
            <GameStatusSelector gameId={id} />
            <BuylistSelector gameId={id} />
            <CollectionSelector
              game={{
                id: game.id,
                title: game.title,
                coverUrl: game.coverUrl,
              }}
            />
          </div>
        </div>
      </header>

      {/* Screenshots Gallery */}
      {game.screenshots && game.screenshots.length > 0 && (
        <section className={styles.screenshotsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Screenshots</h2>
          </div>
          <div className={styles.screenshotsGrid}>
            {game.screenshots.map((screenshot, index) => (
              <button
                key={index}
                className={styles.screenshotThumb}
                onClick={() => setSelectedScreenshot(index)}
              >
                <AppImage src={screenshot} alt={`Screenshot ${index + 1}`} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Screenshot Modal */}
      {selectedScreenshot !== null && game.screenshots && (
        <div
          className={styles.screenshotModal}
          onClick={() => setSelectedScreenshot(null)}
        >
          <button
            className={styles.modalClose}
            onClick={() => setSelectedScreenshot(null)}
          >
            ✕
          </button>
          <button
            className={styles.modalNav + " " + styles.modalPrev}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedScreenshot(
                selectedScreenshot > 0
                  ? selectedScreenshot - 1
                  : game.screenshots.length - 1
              );
            }}
          >
            ‹
          </button>
          <AppImage
            src={game.screenshots[selectedScreenshot]}
            alt={`Screenshot ${selectedScreenshot + 1}`}
            className={styles.modalImage}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className={styles.modalNav + " " + styles.modalNext}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedScreenshot(
                selectedScreenshot < game.screenshots.length - 1
                  ? selectedScreenshot + 1
                  : 0
              );
            }}
          >
            ›
          </button>
          <div className={styles.modalCounter}>
            {selectedScreenshot + 1} / {game.screenshots.length}
          </div>
        </div>
      )}

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
              <div className={styles.crimsonIcon}>
                <Trophy size={32} />
              </div>
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
                    icon={<Star size={48} />}
                    title="No achievements yet"
                    description="Add achievements to this set."
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Star size={48} />}
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
                <div className={styles.trophyIcon}>
                  <Trophy size={24} />
                </div>
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
