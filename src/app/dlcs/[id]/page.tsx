"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Puzzle, Gamepad2, Package, Calendar, DollarSign, Check, Plus } from "lucide-react";
import { gql } from "@apollo/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { AchievementCard, AppImage, Button, EmptyState, BuylistSelector, ExpandableText, PageSkeleton, QueryState, TrophySet, TrophyToolbar, type TrophyFilter } from "@/components";
import type { AchievementTier } from "@/components/AchievementCard";
import { useTrophyTick } from "@/lib/use-trophy-tick";
import styles from "./page.module.css";

const GET_DLC_DETAIL = gql`
  query GetDLCDetail($id: ID!) {
    dlc(id: $id) {
      id
      name
      slug
      type
      description
      coverUrl
      effectiveCoverUrl
      releaseDate
      price
      isOwned
      gameFamilyId
      gameFamily {
        id
        title
        slug
        coverUrl
      }
      achievementSets {
        id
        title
        type
        visibility
        countsTowardTrophy
        achievements {
          id
          title
          description
          iconUrl
          tier
          isCompleted
          earnedPercent
        }
      }
      achievementSetCount
      bundles {
        id
        name
        slug
        type
        coverUrl
      }
    }
  }
`;

const ADD_DLC_TO_OWNED = gql`
  mutation AddDLCToOwned($dlcId: ID!) {
    addDLCToOwned(dlcId: $dlcId) {
      success
      error {
        code
        message
      }
    }
  }
`;

const REMOVE_DLC_FROM_OWNED = gql`
  mutation RemoveDLCFromOwned($dlcId: ID!) {
    removeDLCFromOwned(dlcId: $dlcId) {
      success
      error {
        code
        message
      }
    }
  }
`;

interface GameFamily {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  tier?: AchievementTier;
  isCompleted?: boolean;
  earnedPercent: number | null;
}

interface AchievementSet {
  id: string;
  title: string;
  type: "OFFICIAL" | "COMPLETIONIST" | "CUSTOM";
  visibility: "PRIVATE" | "PUBLIC";
  countsTowardTrophy: boolean;
  achievements: Achievement[];
}

// Same three groups as the game page: sets that gate the trophy, bonus lists,
// and the viewer's own private checklists
function groupSets(sets: AchievementSet[]) {
  const isPrivateCustom = (set: AchievementSet) =>
    set.type === "CUSTOM" && set.visibility === "PRIVATE";
  const gatesTrophy = (set: AchievementSet) =>
    set.countsTowardTrophy && (set.type !== "CUSTOM" || set.visibility === "PUBLIC");
  return [
    { title: "For the Platinum", note: null, sets: sets.filter(gatesTrophy) },
    {
      title: "Extra Lists",
      note: "These don't count toward the Platinum.",
      sets: sets.filter((set) => !gatesTrophy(set) && !isPrivateCustom(set)),
    },
    { title: "Your Lists", note: null, sets: sets.filter(isPrivateCustom) },
  ].filter((group) => group.sets.length > 0);
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  type: string;
  coverUrl?: string | null;
}

interface DLC {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  coverUrl?: string | null;
  effectiveCoverUrl?: string | null;
  releaseDate?: string | null;
  price?: number | null;
  isOwned: boolean;
  gameFamilyId?: string | null;
  gameFamily?: GameFamily | null;
  achievementSets: AchievementSet[];
  achievementSetCount: number;
  bundles: Bundle[];
}

function getDLCTypeLabel(type: string): string {
  switch (type) {
    case "DLC":
      return "DLC";
    case "EXPANSION":
      return "Expansion";
    case "FREE_UPDATE":
      return "Free Update";
    default:
      return type;
  }
}

function getDLCTypeClass(type: string): string {
  switch (type) {
    case "DLC":
      return styles.typeBadgeDLC;
    case "EXPANSION":
      return styles.typeBadgeExpansion;
    case "FREE_UPDATE":
      return styles.typeBadgeFreeUpdate;
    default:
      return "";
  }
}

function getBundleTypeLabel(type: string): string {
  switch (type) {
    case "BUNDLE":
      return "Bundle";
    case "SEASON_PASS":
      return "Season Pass";
    case "COLLECTION":
      return "Collection";
    case "SUBSCRIPTION":
      return "Subscription";
    default:
      return type;
  }
}

export default function DLCDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const { setCurrentEntity, clearEntity } = useAdminMode();
  const [filter, setFilter] = useState<TrophyFilter>("all");
  const [revealAll, setRevealAll] = useState(false);
  const tick = useTrophyTick();

  const { data, loading, error, refetch } = useQuery(GET_DLC_DETAIL, {
    variables: { id },
  });

  const [addToOwned, { loading: addingToOwned }] = useMutation(ADD_DLC_TO_OWNED, {
    variables: { dlcId: id },
    onCompleted: () => {
      refetch();
      toast.success("DLC added to owned.");
    },
    onError: (error) => toast.error(error.message || "Failed to add DLC."),
  });

  const [removeFromOwned, { loading: removingFromOwned }] = useMutation(REMOVE_DLC_FROM_OWNED, {
    variables: { dlcId: id },
    onCompleted: () => {
      refetch();
      toast.success("DLC removed from owned.");
    },
    onError: (error) => toast.error(error.message || "Failed to remove DLC."),
  });

  const dlc: DLC | undefined = data?.dlc;
  const isToggling = addingToOwned || removingFromOwned;

  // Register current entity for admin toolbar
  useEffect(() => {
    if (dlc) {
      setCurrentEntity({
        type: "dlc",
        id: dlc.id,
        title: dlc.name,
      });
    }
    return () => clearEntity();
  }, [dlc, setCurrentEntity, clearEntity]);

  const handleToggleOwnership = () => {
    if (!isSignedIn || isToggling) return;
    if (dlc?.isOwned) {
      removeFromOwned();
    } else {
      addToOwned();
    }
  };

  const coverImage = dlc?.effectiveCoverUrl || dlc?.coverUrl;

  const handleToggleAchievement = (achievementId: string) => {
    const achievement = dlc?.achievementSets
      .flatMap((set) => set.achievements)
      .find((a) => a.id === achievementId);
    if (isSignedIn && achievement) tick(achievement);
  };

  const hasDescriptions =
    dlc?.achievementSets.some((set) => set.achievements.some((a) => a.description)) ?? false;

  const renderAchievement = (achievement: Achievement) => (
    <AchievementCard
      key={achievement.id}
      id={achievement.id}
      title={achievement.title}
      description={achievement.description}
      iconUrl={achievement.iconUrl}
      tier={achievement.tier}
      isCompleted={isSignedIn ? achievement.isCompleted : undefined}
      earnedPercent={achievement.earnedPercent}
      revealDescription={revealAll}
      // The backend awards the Platinum, so it shows without a tick
      onToggle={isSignedIn && achievement.tier !== "PLATINUM" ? handleToggleAchievement : undefined}
    />
  );

  return (
    <div className={styles.container}>
      <QueryState
        isLoading={loading}
        skeleton={<PageSkeleton variant="detail" label="Loading DLC" />}
        error={error}
        errorTitle="Couldn’t load this DLC"
        errorAction={
          <Button href="/games" variant="secondary">
            Browse Games
          </Button>
        }
        isEmpty={!loading && !dlc}
        emptyState={
          <EmptyState
            icon={<Puzzle size={48} />}
            title="DLC not found"
            description="This DLC doesn't exist or has been removed."
            action={
              <Button href="/games">Browse Games</Button>
            }
          />
        }
      >
        {dlc && (
          <>
      <header className={styles.hero}>
        <div className={styles.coverCard}>
          <AppImage
            src={coverImage}
            alt={dlc.name}
            className={styles.cover}
            fallback={
              <div className={styles.coverPlaceholder}>
                <Puzzle size={48} />
              </div>
            }
          />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <h1 className={styles.title}>{dlc.name}</h1>
            <span className={`${styles.typeBadge} ${getDLCTypeClass(dlc.type)}`}>
              {getDLCTypeLabel(dlc.type)}
            </span>
          </div>
          {dlc.description && (
            <ExpandableText text={dlc.description} maxLines={4} className={styles.description} />
          )}

          <div className={styles.metadataGrid}>
            {dlc.releaseDate && (
              <div className={styles.metaCard}>
                <Calendar className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Released</p>
                  <p className={styles.metaValue}>
                    {new Date(dlc.releaseDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
            {dlc.price !== null && dlc.price !== undefined && (
              <div className={styles.metaCard}>
                <DollarSign className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Price</p>
                  <p className={styles.metaValue}>${dlc.price.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{dlc.achievementSetCount}</span>
              <span className={styles.statLabel}>Trophy Lists</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{dlc.bundles.length}</span>
              <span className={styles.statLabel}>Bundle Appearances</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{dlc.isOwned ? "Yes" : "No"}</span>
              <span className={styles.statLabel}>Owned</span>
            </div>
          </div>

          {isSignedIn && (
            <div className={styles.headerActions}>
              <Button
                onClick={handleToggleOwnership}
                loading={isToggling}
                variant={dlc.isOwned ? "secondary" : "primary"}
              >
                {dlc.isOwned ? (
                  <>
                    <Check size={16} />
                    Owned
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Mark as Owned
                  </>
                )}
              </Button>
              <BuylistSelector dlcId={id} />
            </div>
          )}
        </div>
      </header>

      {dlc.gameFamily && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Parent Game</h2>
          </div>
          <Link
            href={`/games/title/${dlc.gameFamily.slug}`}
            className={styles.contentCard}
          >
            <div className={styles.contentMedia}>
              <AppImage
                src={dlc.gameFamily.coverUrl}
                alt={dlc.gameFamily.title}
                className={styles.contentImage}
                fallback={
                  <div className={styles.contentPlaceholder}>
                    <Gamepad2 size={24} />
                  </div>
                }
              />
            </div>
            <div className={styles.contentBody}>
              <h3 className={styles.contentName}>{dlc.gameFamily.title}</h3>
              <p className={styles.contentMeta}>
                Return to the main title to track the full game family and related progress.
              </p>
            </div>
          </Link>
        </section>
      )}

      {dlc.achievementSets.length > 0 && (
        <section className={styles.sectionPanel}>
          <TrophyToolbar
            showFilter={isSignedIn}
            filter={filter}
            onFilterChange={setFilter}
            showReveal={hasDescriptions}
            revealAll={revealAll}
            onRevealAllChange={setRevealAll}
          />
          {groupSets(dlc.achievementSets).map((group) => (
            <div key={group.title} className={styles.trophyGroup}>
              <h2 className={styles.sectionTitle}>{group.title}</h2>
              {group.note && <p className={styles.groupNote}>{group.note}</p>}
              {group.sets.map((set) => (
                <TrophySet
                  key={set.id}
                  title={set.title}
                  achievements={set.achievements}
                  filter={filter}
                  isSignedIn={isSignedIn}
                  defaultOpen
                  renderAchievement={renderAchievement}
                />
              ))}
            </div>
          ))}
        </section>
      )}

      {dlc.bundles.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Available In</h2>
            <span className={styles.countPill}>{dlc.bundles.length}</span>
          </div>
          <div className={styles.contentList}>
            {dlc.bundles.map((bundle) => (
              <Link
                key={bundle.id}
                href={`/bundles/${bundle.id}`}
                className={styles.contentCard}
              >
                <div className={styles.contentMedia}>
                  <AppImage
                    src={bundle.coverUrl}
                    alt={bundle.name}
                    className={styles.contentImage}
                    fallback={
                      <div className={styles.contentPlaceholder}>
                        <Package size={24} />
                      </div>
                    }
                  />
                </div>
                <div className={styles.contentBody}>
                  <h3 className={styles.contentName}>{bundle.name}</h3>
                  <span className={styles.contentPill}>{getBundleTypeLabel(bundle.type)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {dlc.achievementSets.length === 0 && dlc.bundles.length === 0 && !dlc.gameFamily && (
        <section className={styles.sectionPanel}>
          <EmptyState
            icon={<Puzzle size={48} />}
            title="No additional content"
            description="This DLC doesn't have any associated trophy lists, bundles, or parent game."
          />
        </section>
      )}
          </>
        )}
      </QueryState>
    </div>
  );
}
