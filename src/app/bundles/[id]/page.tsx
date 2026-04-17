"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Package, Gamepad2, Puzzle, Calendar, DollarSign, Check, Plus } from "lucide-react";
import { gql } from "@apollo/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { AppImage, Button, LoadingSpinner, EmptyState, BuylistSelector, ExpandableText } from "@/components";
import styles from "./page.module.css";

const GET_BUNDLE_DETAIL = gql`
  query GetBundleDetail($id: ID!) {
    bundle(id: $id) {
      id
      name
      slug
      type
      description
      coverUrl
      releaseDate
      price
      isOwned
      gameCount: gameFamilyCount
      dlcCount
      games: gameFamilies {
        id
        title
        coverUrl
        slug
        achievementCount: totalAchievementCount
        trophyCount: totalTrophyCount
        platformCount: gameCount
        platforms {
          id
          name
          slug
        }
      }
      dlcs {
        id
        name
        slug
        type
        description
        coverUrl
        effectiveCoverUrl
        game: gameFamily {
          id
          title
          slug
        }
      }
    }
  }
`;

const ADD_BUNDLE_TO_OWNED = gql`
  mutation AddBundleToOwned($bundleId: ID!) {
    addBundleToOwned(bundleId: $bundleId) {
      success
      error {
        code
        message
      }
    }
  }
`;

const REMOVE_BUNDLE_FROM_OWNED = gql`
  mutation RemoveBundleFromOwned($bundleId: ID!) {
    removeBundleFromOwned(bundleId: $bundleId) {
      success
      error {
        code
        message
      }
    }
  }
`;

interface Game {
  id: string;
  title: string;
  slug: string;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
  platformCount: number;
  platforms: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface DLC {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  coverUrl?: string | null;
  effectiveCoverUrl?: string | null;
  game?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  coverUrl?: string | null;
  releaseDate?: string | null;
  price?: number | null;
  isOwned: boolean;
  gameCount: number;
  dlcCount: number;
  games: Game[];
  dlcs: DLC[];
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

function getBundleTypeClass(type: string): string {
  switch (type) {
    case "BUNDLE":
      return styles.typeBadgeBundle;
    case "SEASON_PASS":
      return styles.typeBadgeSeasonPass;
    case "COLLECTION":
      return styles.typeBadgeCollection;
    case "SUBSCRIPTION":
      return styles.typeBadgeSubscription;
    default:
      return "";
  }
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

export default function BundleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isSignedIn } = useAuth();
  const { setCurrentEntity, clearEntity } = useAdminMode();

  const { data, loading, error, refetch } = useQuery(GET_BUNDLE_DETAIL, {
    variables: { id },
  });

  const [addToOwned, { loading: addingToOwned }] = useMutation(ADD_BUNDLE_TO_OWNED, {
    variables: { bundleId: id },
    onCompleted: () => {
      refetch();
      toast.success("Bundle added to owned.");
    },
    onError: (error) => toast.error(error.message || "Failed to add bundle."),
  });

  const [removeFromOwned, { loading: removingFromOwned }] = useMutation(REMOVE_BUNDLE_FROM_OWNED, {
    variables: { bundleId: id },
    onCompleted: () => {
      refetch();
      toast.success("Bundle removed from owned.");
    },
    onError: (error) => toast.error(error.message || "Failed to remove bundle."),
  });

  const bundle: Bundle | undefined = data?.bundle;
  const isToggling = addingToOwned || removingFromOwned;

  // Register current entity for admin toolbar
  useEffect(() => {
    if (bundle) {
      setCurrentEntity({
        type: "bundle",
        id: bundle.id,
        title: bundle.name,
      });
    }
    return () => clearEntity();
  }, [bundle, setCurrentEntity, clearEntity]);

  const handleToggleOwnership = () => {
    if (!isSignedIn || isToggling) return;
    if (bundle?.isOwned) {
      removeFromOwned();
    } else {
      addToOwned();
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading bundle..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error loading bundle: {error.message}</p>
          <Button href="/bundles" variant="secondary">
            Back to Bundles
          </Button>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon={<Package size={48} />}
          title="Bundle not found"
          description="This bundle doesn't exist or has been removed."
          action={
            <Button href="/bundles">Back to Bundles</Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Bundle Header */}
      <header className={styles.header}>
        <div className={styles.coverContainer}>
          <AppImage
            src={bundle.coverUrl}
            alt={bundle.name}
            className={styles.cover}
            fallback={
              <div className={styles.coverPlaceholder}>
                <Package size={48} />
              </div>
            }
          />
        </div>
        <div className={styles.headerContent}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{bundle.name}</h1>
            <span className={`${styles.typeBadge} ${getBundleTypeClass(bundle.type)}`}>
              {getBundleTypeLabel(bundle.type)}
            </span>
          </div>
          {bundle.description && (
            <ExpandableText text={bundle.description} maxLines={4} className={styles.description} />
          )}

          {/* Metadata */}
          <div className={styles.metadata}>
            {bundle.releaseDate && (
              <div className={styles.metaItem}>
                <Calendar className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Released</span>
                <span className={styles.metaValue}>
                  {new Date(bundle.releaseDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {bundle.price !== null && bundle.price !== undefined && (
              <div className={styles.metaItem}>
                <DollarSign className={styles.metaIcon} size={16} />
                <span className={styles.metaLabel}>Price</span>
                <span className={styles.metaValue}>
                  ${bundle.price.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{bundle.gameCount}</span>
              <span className={styles.statLabel}>
                {bundle.gameCount === 1 ? "Game" : "Games"}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{bundle.dlcCount}</span>
              <span className={styles.statLabel}>
                {bundle.dlcCount === 1 ? "DLC" : "DLCs"}
              </span>
            </div>
          </div>

          {isSignedIn && (
            <div className={styles.headerActions}>
              <Button
                onClick={handleToggleOwnership}
                loading={isToggling}
                variant={bundle.isOwned ? "secondary" : "primary"}
              >
                {bundle.isOwned ? (
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
              <BuylistSelector bundleId={id} />
            </div>
          )}
        </div>
      </header>

      {/* Games Section */}
      {bundle.games.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Gamepad2 size={20} />
              Included Titles
            </h2>
            <span className={styles.sectionCount}>{bundle.games.length}</span>
          </div>
          <div className={styles.dlcList}>
            {bundle.games.map((game) => (
              <Link
                key={game.id}
                href={`/games/title/${game.slug}`}
                className={styles.dlcCard}
              >
                <div className={styles.dlcImageContainer}>
                  <AppImage
                    src={game.coverUrl}
                    alt={game.title}
                    className={styles.dlcImage}
                    fallback={
                      <div className={styles.dlcPlaceholder}>
                        <Gamepad2 size={24} />
                      </div>
                    }
                  />
                </div>
                <div className={styles.dlcContent}>
                  <h3 className={styles.dlcName}>{game.title}</h3>
                  <p className={styles.dlcGame}>
                    {game.platformCount === 1
                      ? "1 platform version"
                      : `${game.platformCount} platform versions`}
                  </p>
                  {game.platforms.length > 0 && (
                    <p className={styles.dlcGame}>
                      {game.platforms.map((platform) => platform.name).join(" • ")}
                    </p>
                  )}
                  <span className={styles.dlcType}>
                    {game.achievementCount} achievements
                    {game.trophyCount > 0 ? ` • ${game.trophyCount} trophies` : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* DLCs Section */}
      {bundle.dlcs.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Puzzle size={20} />
              Included DLCs
            </h2>
            <span className={styles.sectionCount}>{bundle.dlcs.length}</span>
          </div>
          <div className={styles.dlcList}>
            {bundle.dlcs.map((dlc) => (
              <Link
                key={dlc.id}
                href={`/dlcs/${dlc.id}`}
                className={styles.dlcCard}
              >
                <div className={styles.dlcImageContainer}>
                  <AppImage
                    src={dlc.effectiveCoverUrl || dlc.coverUrl}
                    alt={dlc.name}
                    className={styles.dlcImage}
                    fallback={
                      <div className={styles.dlcPlaceholder}>
                        <Puzzle size={24} />
                      </div>
                    }
                  />
                </div>
                <div className={styles.dlcContent}>
                  <h3 className={styles.dlcName}>{dlc.name}</h3>
                  {dlc.game && (
                    <p className={styles.dlcGame}>{dlc.game.title}</p>
                  )}
                  <span className={styles.dlcType}>{getDLCTypeLabel(dlc.type)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty content */}
      {bundle.games.length === 0 && bundle.dlcs.length === 0 && (
        <EmptyState
          icon={<Package size={48} />}
          title="No content yet"
          description="This bundle doesn't have any games or DLCs associated with it."
        />
      )}
    </div>
  );
}
