"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Gamepad2, Trophy, Star, Target, Calendar, Code2, Building2, ShieldAlert, ImageIcon } from "lucide-react";
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

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  const screenshotCount = game.screenshots.length;

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
      <header className={styles.hero}>
        <div className={styles.coverCard}>
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
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <div className={styles.eyebrow}>
              <Gamepad2 size={14} />
              <span>Game Detail</span>
            </div>
            {game.platform && (
              <span className={styles.platformBadge}>{game.platform.name}</span>
            )}
          </div>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{game.title}</h1>
            <p className={styles.subtitle}>
              Achievement tracking, release context, and community completion in one place.
            </p>
          </div>
          {game.description && (
            <ExpandableText text={game.description} maxLines={4} className={styles.description} />
          )}

          <div className={styles.metadataGrid}>
            {game.releaseDate && (
              <div className={styles.metaCard}>
                <Calendar className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Released</p>
                  <p className={styles.metaValue}>
                    {new Date(game.releaseDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
            {game.developer && (
              <div className={styles.metaCard}>
                <Code2 className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Developer</p>
                  <p className={styles.metaValue}>{game.developer}</p>
                </div>
              </div>
            )}
            {game.publisher && (
              <div className={styles.metaCard}>
                <Building2 className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Publisher</p>
                  <p className={styles.metaValue}>{game.publisher}</p>
                </div>
              </div>
            )}
            {game.genre && (
              <div className={styles.metaCard}>
                <Target className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Genre</p>
                  <p className={styles.metaValue}>{game.genre}</p>
                </div>
              </div>
            )}
            {game.esrbRating && (
              <div className={styles.metaCard}>
                <ShieldAlert className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Rating</p>
                  <p className={styles.metaValue}>{game.esrbRating}</p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalCount}</span>
              <span className={styles.statLabel}>Achievements</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{game.achievementSets.length}</span>
              <span className={styles.statLabel}>Set Collections</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{game.trophyCount}</span>
              <span className={styles.statLabel}>Crimson Trophies</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{game.trophies.length}</span>
              <span className={styles.statLabel}>Trophy Holders</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{screenshotCount}</span>
              <span className={styles.statLabel}>Screenshots</span>
            </div>
            {isSignedIn && totalCount > 0 && (
              <div className={styles.statCard}>
                <span className={styles.statValue}>{progress}%</span>
                <span className={styles.statLabel}>Your Progress</span>
              </div>
            )}
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

      {game.screenshots.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Visuals</p>
              <h2 className={styles.sectionTitle}>Screenshot Gallery</h2>
            </div>
            <span className={styles.countPill}>{game.screenshots.length}</span>
          </div>
          <div className={styles.screenshotsGrid}>
            {game.screenshots.map((screenshot, index) => (
              <button
                key={index}
                className={styles.screenshotThumb}
                onClick={() => setSelectedScreenshot(index)}
              >
                <AppImage src={screenshot} alt={`Screenshot ${index + 1}`} />
                <span className={styles.screenshotCaption}>
                  <ImageIcon size={14} />
                  <span>Open shot {index + 1}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

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

      {isSignedIn && totalCount > 0 && (
        <section className={styles.progressPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Tracking</p>
              <h2 className={styles.sectionTitle}>Your Progress</h2>
            </div>
            <span className={styles.progressSummary}>
              {completedCount} / {totalCount} complete
            </span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.progressCopy}>
            You have cleared {progress}% of this game&rsquo;s tracked achievements.
          </p>
          {progress === 100 && (
            <div className={styles.crimsonTrophy}>
              <div className={styles.crimsonIcon}>
                <Trophy size={32} />
              </div>
              <div className={styles.crimsonContent}>
                <span className={styles.crimsonTitle}>Crimson Trophy Earned</span>
                <span className={styles.crimsonSubtitle}>100% completion achieved</span>
              </div>
            </div>
          )}
        </section>
      )}

      <section className={styles.sectionPanel}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Challenges</p>
            <h2 className={styles.sectionTitle}>Achievement Sets</h2>
          </div>
          <span className={styles.countPill}>{game.achievementSets.length}</span>
        </div>

        {game.achievementSets.length > 0 ? (
          <div className={styles.achievementGroupList}>
            {game.achievementSets.map((set) => (
              <div key={set.id} className={styles.setCard}>
                <div className={styles.setHeader}>
                  <div>
                    <h3 className={styles.setTitle}>{set.title}</h3>
                    <div className={styles.setMetaRow}>
                      <span className={styles.metaBadge}>{formatEnumLabel(set.type)}</span>
                      <span className={styles.metaBadgeMuted}>{formatEnumLabel(set.visibility)}</span>
                      <span className={styles.metaBadgeMuted}>
                        {set.achievements.length} achievement{set.achievements.length === 1 ? "" : "s"}
                      </span>
                    </div>
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
        <section className={styles.creatorPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Create</p>
              <h2 className={styles.sectionTitle}>Build Your Custom Challenge Set</h2>
            </div>
          </div>

          <div className={styles.creatorGrid}>
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>Start a New Set</h3>
              <p className={styles.formCopy}>
                Create a personal ruleset for speedruns, challenge runs, or community events.
              </p>
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
            </div>

            {ownedCustomSets.length > 0 && (
              <div className={styles.formCard}>
                <h3 className={styles.formTitle}>Add Achievements</h3>
                <p className={styles.formCopy}>
                  Expand one of your custom sets with new goals, descriptions, and iconography.
                </p>
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
                  <div className={styles.inlineFields}>
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
                  </div>
                  <Button type="submit" loading={creatingAchievement}>
                    Add Achievement
                  </Button>
                </form>
              </div>
            )}
          </div>
        </section>
      )}

      {game.trophies.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Community</p>
              <h2 className={styles.sectionTitle}>Trophy Holders</h2>
            </div>
            <span className={styles.countPill}>{game.trophies.length}</span>
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
                    Earned on {new Date(trophy.createdAt).toLocaleDateString()}
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
