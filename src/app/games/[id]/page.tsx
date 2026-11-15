"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Gamepad2, Trophy, Star, Target, Calendar, Code2, Building2, ShieldAlert, ImageIcon, Info } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { GET_GAME, GET_ME } from "@/graphql/queries";
import {
  MARK_ACHIEVEMENT_COMPLETE,
  MARK_ALL_ACHIEVEMENTS_COMPLETE,
  UNMARK_ACHIEVEMENT_COMPLETE,
} from "@/graphql/mutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AchievementCard, AppImage, Button, EmptyState, GameStatusSelector, BuylistSelector, CollectionSelector, ExpandableText, PlatformIcon, PageSkeleton, QueryState } from "@/components";
import type { AchievementTier } from "@/components/AchievementCard";
import { TrophySilhouette } from "@/components/TrophyShelf";
import { getDisplayName } from "@/lib/avatar-utils";
import styles from "./page.module.css";

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  tier?: AchievementTier;
  isCompleted?: boolean;
  userCount: number;
  achievementSetId: string;
}

// Tier sort priority (higher = more rare = shown first)
const tierPriority: Record<AchievementTier, number> = {
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

// Best first, the order the trophy list is grouped in. No Platinum: a list's
// Platinum is the trophy itself and heads the section instead.
const TIERS: AchievementTier[] = ["GOLD", "SILVER", "BRONZE"];

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
  };
}

interface AchievementSet {
  id: string;
  title: string;
  type: "OFFICIAL" | "COMPLETIONIST" | "CUSTOM";
  visibility: "PRIVATE" | "PUBLIC";
  countsTowardTrophy: boolean;
  createdByUserId?: string | null;
  achievements: Achievement[];
}

// Sets that count towards the game's trophy, the rule the backend awards it
// by: official and completionist sets, plus custom sets their creator has
// published. A private custom set is a personal checklist, and a set flagged
// off restates another list.
function countsTowardTrophy(set: AchievementSet): boolean {
  return set.countsTowardTrophy && (set.type !== "CUSTOM" || set.visibility === "PUBLIC");
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
      toast.success("Trophy marked complete.");
    },
    onError: (error) => {
      setTogglingId(null);
      toast.error(error.message || "Failed to mark trophy.");
    },
  });

  const [unmarkComplete] = useMutation(UNMARK_ACHIEVEMENT_COMPLETE, {
    onCompleted: () => {
      refetch();
      setTogglingId(null);
      toast.success("Trophy unmarked.");
    },
    onError: (error) => {
      setTogglingId(null);
      toast.error(error.message || "Failed to unmark trophy.");
    },
  });

  const [confirmingMarkAll, setConfirmingMarkAll] = useState(false);
  const [markAllComplete, { loading: markingAll }] = useMutation(MARK_ALL_ACHIEVEMENTS_COMPLETE, {
    onCompleted: (result) => {
      setConfirmingMarkAll(false);
      if (result.markAllAchievementsComplete.success) {
        refetch();
        toast.success("Platinum earned.");
      } else {
        toast.error(
          result.markAllAchievementsComplete.error?.message || "Failed to mark trophies."
        );
      }
    },
    onError: (error) => {
      setConfirmingMarkAll(false);
      toast.error(error.message || "Failed to mark trophies.");
    },
  });

  const game: Game | undefined = data?.game;
  const me = meData?.me;

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

  const allAchievements = game?.achievementSets.flatMap((set) => set.achievements) ?? [];
  const gatingAchievements =
    game?.achievementSets.filter(countsTowardTrophy).flatMap((set) => set.achievements) ?? [];
  // The Platinum is the trophy under the game's own name. The backend awards
  // it once everything else is done, so it is neither ticked nor counted.
  const platinum = gatingAchievements.find((a) => a.tier === "PLATINUM");
  // Progress only counts the sets that award the trophy
  const trophyAchievements = gatingAchievements.filter((a) => a.tier !== "PLATINUM");
  const trophyAchievementCount = trophyAchievements.length;
  const completedCount = trophyAchievements.filter((a: Achievement) => a.isCompleted).length;
  const isTrophyComplete = trophyAchievementCount > 0 && completedCount === trophyAchievementCount;
  // Round down, so 199 of 200 reads 99% rather than 100%
  const progress =
    trophyAchievementCount > 0 ? Math.floor((completedCount / trophyAchievementCount) * 100) : 0;
  const screenshotCount = game?.screenshots.length ?? 0;

  // Calculate total players for rarity (max userCount across all achievements)
  const totalPlayers = allAchievements.length > 0
    ? Math.max(...allAchievements.map((a) => a.userCount))
    : 0;

  // The trophy has one list: every achievement in the sets that gate it.
  // Sets that don't gate stay below as extras.
  const requiredSets = game?.achievementSets.filter(countsTowardTrophy) ?? [];
  const extraSets = game?.achievementSets.filter((set) => !countsTowardTrophy(set)) ?? [];
  const myTrophy = game?.trophies.find((trophy) => trophy.user.id === me?.id);
  // The cabinet light comes up as the player closes in on the trophy. A
  // signed-out visitor sees it fully lit, and it never goes dark enough to
  // hide the silhouette.
  const trophyGlow = isSignedIn ? 0.25 + 0.75 * (progress / 100) : 1;
  // The platinum's own icon when it has one, else the box art, framed like a
  // display piece. Icons are square, covers are 3:4.
  const trophyArt = platinum?.iconUrl ?? game?.coverUrl;
  const trophyArtRatio = platinum?.iconUrl ? "1" : game?.coverUrl ? "3 / 4" : undefined;

  const renderAchievement = (achievement: Achievement) => (
    <AchievementCard
      key={achievement.id}
      id={achievement.id}
      title={achievement.title}
      description={achievement.description}
      iconUrl={achievement.iconUrl}
      tier={achievement.tier}
      isCompleted={achievement.isCompleted}
      userCount={achievement.userCount}
      totalPlayers={totalPlayers}
      onToggle={isSignedIn ? handleToggleAchievement : undefined}
      loading={togglingId === achievement.id}
    />
  );

  const renderSet = (set: AchievementSet, showProgress: boolean) => (
    <div key={set.id} className={styles.setCard}>
      <div className={styles.setHeader}>
        <h3 className={styles.setTitle}>{set.title}</h3>
        <div className={styles.setActions}>
          {showProgress && set.achievements.length > 0 && (
            <span className={styles.progressSummary}>
              {isSignedIn && `${set.achievements.filter((a) => a.isCompleted).length} / `}
              {set.achievements.length}
            </span>
          )}
        </div>
      </div>

      {set.achievements.length > 0 ? (
        <div className={styles.achievementList}>
          {sortByTier(set.achievements).map(renderAchievement)}
        </div>
      ) : (
        <EmptyState
          icon={<Star size={48} />}
          title="No trophies yet"
          description="Add trophies to this list."
        />
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <QueryState
        isLoading={loading}
        skeleton={<PageSkeleton variant="detail" label="Loading game" />}
        error={error}
        errorTitle="Couldn’t load this game"
        errorAction={
          <Button href="/games" variant="secondary">
            Back to Games
          </Button>
        }
        isEmpty={!loading && !game}
        emptyState={
          <EmptyState
            icon={<Gamepad2 size={48} />}
            title="Game not found"
            description="This game doesn't exist or has been removed."
            action={
              <Button href="/games">Back to Games</Button>
            }
          />
        }
      >
        {game && (
          <>
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
            <h1 className={styles.title}>{game.title}</h1>
            {game.platform && (
              <span className={styles.platformBadge}>
                <PlatformIcon
                  slug={game.platform.slug}
                  name={game.platform.name}
                  className={styles.platformIcon}
                  fallback={game.platform.name}
                />
              </span>
            )}
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
              <span className={styles.statValue}>{trophyAchievementCount}</span>
              <span className={styles.statLabel}>Trophies</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{game.trophies.length}</span>
              <span className={styles.statLabel}>Platinum Holders</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{screenshotCount}</span>
              <span className={styles.statLabel}>Screenshots</span>
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

      {game.screenshots.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Screenshot Gallery</h2>
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

      {trophyAchievementCount > 0 && (
        <section className={styles.progressPanel}>
          <div className={styles.trophyHero}>
            <div
              className={styles.trophyNiche}
              style={{ "--glow": trophyGlow, "--ratio": trophyArtRatio } as React.CSSProperties}
              aria-hidden
            >
              <AppImage
                src={trophyArt}
                className={styles.trophyArt}
                fallback={<TrophySilhouette className={styles.trophyShape} />}
              />
            </div>
            <div className={styles.trophyBody}>
              <div className={styles.progressHeading}>
                <h2 className={styles.sectionTitle}>
                  {platinum?.title ?? (isTrophyComplete ? "Platinum Earned" : "The Platinum")}
                </h2>
                {platinum?.description && (
                  <Popover.Root>
                    <Popover.Trigger
                      openOnHover
                      delay={100}
                      className={styles.infoTrigger}
                      aria-label="About this trophy"
                    >
                      <Info size={18} />
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Positioner side="top" sideOffset={8} className="z-50">
                        <Popover.Popup className={styles.infoBubble}>
                          {platinum.description}
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                )}
              </div>
              {isSignedIn ? (
                <>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>
                  <div className={styles.trophyFooter}>
                    <p className={styles.trophyLine}>
                      {isTrophyComplete && myTrophy
                        ? `Earned on ${new Date(myTrophy.createdAt).toLocaleDateString()}`
                        : `${completedCount} / ${trophyAchievementCount}`}
                    </p>
                    {/* For a player who already finished the game elsewhere */}
                    {!isTrophyComplete && (
                      <Button variant="secondary" size="sm" onClick={() => setConfirmingMarkAll(true)}>
                        Mark all complete
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                !platinum?.description && (
                  <p className={styles.trophyLine}>
                    Earn all {trophyAchievementCount} trophies to get it.
                  </p>
                )
              )}
            </div>
          </div>

          {TIERS.map((tier) => {
            const inTier = trophyAchievements.filter((a) => (a.tier ?? "BRONZE") === tier);
            return (
              inTier.length > 0 && (
                <div key={tier} className={styles.tierGroup}>
                  <h3 className={styles.tierHeading}>{tier.toLowerCase()}</h3>
                  <div className={styles.achievementList}>{inTier.map(renderAchievement)}</div>
                </div>
              )
            );
          })}

          <p className={styles.listSource}>{requiredSets.map((set) => set.title).join(" + ")}</p>
        </section>
      )}

      <Dialog open={confirmingMarkAll} onOpenChange={setConfirmingMarkAll}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Mark all {trophyAchievementCount} complete?</DialogTitle>
            <DialogDescription>
              This marks every trophy as earned and awards the Platinum. To undo it, you untick
              trophies one at a time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmingMarkAll(false)}>
              Cancel
            </Button>
            <Button
              loading={markingAll}
              onClick={() => markAllComplete({ variables: { gameFamilyId: game.gameFamilyId } })}
            >
              Mark all complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {extraSets.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Extra Lists</h2>
          </div>
          <p className={styles.sectionNote}>These don&apos;t count toward the Platinum.</p>
          <div className={styles.achievementGroupList}>
            {extraSets.map((set) => renderSet(set, true))}
          </div>
        </section>
      )}

      {game.achievementSets.length === 0 && (
        <section className={styles.sectionPanel}>
          <EmptyState
            icon={<Star size={48} />}
            title="No trophies yet"
            description="This game doesn't have a trophy list yet."
          />
        </section>
      )}

      {game.trophies.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Platinum Holders</h2>
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
                    {getDisplayName(trophy.user.name, trophy.user.id)}
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
          </>
        )}
      </QueryState>
    </div>
  );
}
