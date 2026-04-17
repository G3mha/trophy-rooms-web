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
      <header className={styles.hero}>
        <div className={styles.coverCard}>
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
        <div className={styles.heroContent}>
          <div className={styles.heroHeader}>
            <div className={styles.eyebrow}>
              <Package size={14} />
              <span>Bundle Detail</span>
            </div>
            <span className={`${styles.typeBadge} ${getBundleTypeClass(bundle.type)}`}>
              {getBundleTypeLabel(bundle.type)}
            </span>
          </div>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{bundle.name}</h1>
            <p className={styles.subtitle}>
              Included games, add-on coverage, and ownership status in one view.
            </p>
          </div>
          {bundle.description && (
            <ExpandableText text={bundle.description} maxLines={4} className={styles.description} />
          )}

          <div className={styles.metadataGrid}>
            {bundle.releaseDate && (
              <div className={styles.metaCard}>
                <Calendar className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Released</p>
                  <p className={styles.metaValue}>
                    {new Date(bundle.releaseDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
            {bundle.price !== null && bundle.price !== undefined && (
              <div className={styles.metaCard}>
                <DollarSign className={styles.metaIcon} size={16} />
                <div>
                  <p className={styles.metaLabel}>Price</p>
                  <p className={styles.metaValue}>${bundle.price.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{bundle.gameCount}</span>
              <span className={styles.statLabel}>Included Titles</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{bundle.dlcCount}</span>
              <span className={styles.statLabel}>Included DLCs</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{bundle.isOwned ? "Yes" : "No"}</span>
              <span className={styles.statLabel}>Owned</span>
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

      {bundle.games.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Catalog</p>
              <h2 className={styles.sectionTitle}>Included Titles</h2>
            </div>
            <span className={styles.countPill}>{bundle.games.length}</span>
          </div>
          <div className={styles.contentList}>
            {bundle.games.map((game) => (
              <Link
                key={game.id}
                href={`/games/title/${game.slug}`}
                className={styles.contentCard}
              >
                <div className={styles.contentMedia}>
                  <AppImage
                    src={game.coverUrl}
                    alt={game.title}
                    className={styles.contentImage}
                    fallback={
                      <div className={styles.contentPlaceholder}>
                        <Gamepad2 size={24} />
                      </div>
                    }
                  />
                </div>
                <div className={styles.contentBody}>
                  <h3 className={styles.contentName}>{game.title}</h3>
                  <p className={styles.contentMeta}>
                    {game.platformCount === 1
                      ? "1 platform version"
                      : `${game.platformCount} platform versions`}
                  </p>
                  {game.platforms.length > 0 && (
                    <p className={styles.contentMeta}>
                      {game.platforms.map((platform) => platform.name).join(" • ")}
                    </p>
                  )}
                  <span className={styles.contentPill}>
                    {game.achievementCount} achievements
                    {game.trophyCount > 0 ? ` • ${game.trophyCount} trophies` : ""}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bundle.dlcs.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Add-Ons</p>
              <h2 className={styles.sectionTitle}>Included DLCs</h2>
            </div>
            <span className={styles.countPill}>{bundle.dlcs.length}</span>
          </div>
          <div className={styles.contentList}>
            {bundle.dlcs.map((dlc) => (
              <Link
                key={dlc.id}
                href={`/dlcs/${dlc.id}`}
                className={styles.contentCard}
              >
                <div className={styles.contentMedia}>
                  <AppImage
                    src={dlc.effectiveCoverUrl || dlc.coverUrl}
                    alt={dlc.name}
                    className={styles.contentImage}
                    fallback={
                      <div className={styles.contentPlaceholder}>
                        <Puzzle size={24} />
                      </div>
                    }
                  />
                </div>
                <div className={styles.contentBody}>
                  <h3 className={styles.contentName}>{dlc.name}</h3>
                  {dlc.game && (
                    <p className={styles.contentMeta}>{dlc.game.title}</p>
                  )}
                  <span className={styles.contentPill}>{getDLCTypeLabel(dlc.type)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {bundle.games.length === 0 && bundle.dlcs.length === 0 && (
        <section className={styles.sectionPanel}>
          <EmptyState
            icon={<Package size={48} />}
            title="No content yet"
            description="This bundle doesn't have any games or DLCs associated with it."
          />
        </section>
      )}
    </div>
  );
}
