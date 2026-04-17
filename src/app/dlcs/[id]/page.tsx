"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Puzzle, Gamepad2, Package, Calendar, DollarSign, Check, Plus, Award } from "lucide-react";
import { gql } from "@apollo/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { AppImage, Button, LoadingSpinner, EmptyState, BuylistSelector, ExpandableText } from "@/components";
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
        achievementCount
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

interface AchievementSet {
  id: string;
  title: string;
  achievementCount: number;
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

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading DLC..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error loading DLC: {error.message}</p>
          <Button href="/games" variant="secondary">
            Browse Games
          </Button>
        </div>
      </div>
    );
  }

  if (!dlc) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon={<Puzzle size={48} />}
          title="DLC not found"
          description="This DLC doesn't exist or has been removed."
          action={
            <Button href="/games">Browse Games</Button>
          }
        />
      </div>
    );
  }

  const coverImage = dlc.effectiveCoverUrl || dlc.coverUrl;

  return (
    <div className={styles.container}>
      {/* DLC Header */}
      <header className={styles.header}>
        <div className={styles.coverContainer}>
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
        <div className={styles.headerContent}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{dlc.name}</h1>
            <span className={`${styles.typeBadge} ${getDLCTypeClass(dlc.type)}`}>
              {getDLCTypeLabel(dlc.type)}
            </span>
          </div>
          {dlc.description && (
            <ExpandableText text={dlc.description} maxLines={4} className={styles.description} />
          )}

          {/* Metadata */}
          <div className={styles.metadata}>
            {dlc.releaseDate && (
              <div className={styles.metaItem}>
                <Calendar className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Released</span>
                <span className={styles.metaValue}>
                  {new Date(dlc.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {dlc.price !== null && dlc.price !== undefined && (
              <div className={styles.metaItem}>
                <DollarSign className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Price</span>
                <span className={styles.metaValue}>
                  ${dlc.price.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{dlc.achievementSetCount}</span>
              <span className={styles.statLabel}>
                {dlc.achievementSetCount === 1 ? "Achievement Set" : "Achievement Sets"}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{dlc.bundles.length}</span>
              <span className={styles.statLabel}>
                {dlc.bundles.length === 1 ? "Bundle" : "Bundles"}
              </span>
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

      {/* Parent Game Section */}
      {dlc.gameFamily && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Gamepad2 size={20} />
              Parent Game
            </h2>
          </div>
          <Link
            href={`/games/title/${dlc.gameFamily.slug}`}
            className={styles.gameCard}
          >
            <div className={styles.gameImageContainer}>
              <AppImage
                src={dlc.gameFamily.coverUrl}
                alt={dlc.gameFamily.title}
                className={styles.gameImage}
                fallback={
                  <div className={styles.gamePlaceholder}>
                    <Gamepad2 size={24} />
                  </div>
                }
              />
            </div>
            <div className={styles.gameContent}>
              <h3 className={styles.gameName}>{dlc.gameFamily.title}</h3>
            </div>
          </Link>
        </section>
      )}

      {/* Achievement Sets Section */}
      {dlc.achievementSets.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Award size={20} />
              Achievement Sets
            </h2>
            <span className={styles.sectionCount}>{dlc.achievementSets.length}</span>
          </div>
          <div className={styles.achievementSetList}>
            {dlc.achievementSets.map((set) => (
              <div key={set.id} className={styles.achievementSetCard}>
                <div className={styles.achievementSetIcon}>
                  <Award size={20} />
                </div>
                <div className={styles.achievementSetContent}>
                  <h3 className={styles.achievementSetName}>{set.title}</h3>
                  <span className={styles.achievementSetCount}>
                    {set.achievementCount} {set.achievementCount === 1 ? "achievement" : "achievements"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bundles Section */}
      {dlc.bundles.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Package size={20} />
              Available In
            </h2>
            <span className={styles.sectionCount}>{dlc.bundles.length}</span>
          </div>
          <div className={styles.bundleList}>
            {dlc.bundles.map((bundle) => (
              <Link
                key={bundle.id}
                href={`/bundles/${bundle.id}`}
                className={styles.bundleCard}
              >
                <div className={styles.bundleImageContainer}>
                  <AppImage
                    src={bundle.coverUrl}
                    alt={bundle.name}
                    className={styles.bundleImage}
                    fallback={
                      <div className={styles.bundlePlaceholder}>
                        <Package size={24} />
                      </div>
                    }
                  />
                </div>
                <div className={styles.bundleContent}>
                  <h3 className={styles.bundleName}>{bundle.name}</h3>
                  <span className={styles.bundleType}>{getBundleTypeLabel(bundle.type)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty content */}
      {dlc.achievementSets.length === 0 && dlc.bundles.length === 0 && !dlc.gameFamily && (
        <EmptyState
          icon={<Puzzle size={48} />}
          title="No additional content"
          description="This DLC doesn't have any associated achievement sets, bundles, or parent game."
        />
      )}
    </div>
  );
}
