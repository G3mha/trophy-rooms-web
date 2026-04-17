"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Puzzle, Gamepad2, Package, Calendar, DollarSign, Check, Plus, Award } from "lucide-react";
import { gql } from "@apollo/client";
import { useAdminMode } from "@/contexts/AdminModeContext";
import { AppImage, Button, LoadingSpinner, EmptyState, ErrorState, BuylistSelector, ExpandableText } from "@/components";
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
        <ErrorState
          title="Couldn’t load this DLC"
          description={error.message}
          action={
            <Button href="/games" variant="secondary">
              Browse Games
            </Button>
          }
        />
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
            <div className={styles.eyebrow}>
              <Puzzle size={14} />
              <span>DLC Detail</span>
            </div>
            <span className={`${styles.typeBadge} ${getDLCTypeClass(dlc.type)}`}>
              {getDLCTypeLabel(dlc.type)}
            </span>
          </div>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{dlc.name}</h1>
            <p className={styles.subtitle}>
              Expansion context, achievement support, and bundle coverage at a glance.
            </p>
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
              <span className={styles.statLabel}>Achievement Sets</span>
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
            <div>
              <p className={styles.sectionEyebrow}>Base Title</p>
              <h2 className={styles.sectionTitle}>Parent Game</h2>
            </div>
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
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Challenges</p>
              <h2 className={styles.sectionTitle}>Achievement Sets</h2>
            </div>
            <span className={styles.countPill}>{dlc.achievementSets.length}</span>
          </div>
          <div className={styles.contentList}>
            {dlc.achievementSets.map((set) => (
              <div key={set.id} className={styles.contentCard}>
                <div className={styles.iconTile}>
                  <Award size={20} />
                </div>
                <div className={styles.contentBody}>
                  <h3 className={styles.contentName}>{set.title}</h3>
                  <span className={styles.contentPill}>
                    {set.achievementCount} {set.achievementCount === 1 ? "achievement" : "achievements"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {dlc.bundles.length > 0 && (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Packaging</p>
              <h2 className={styles.sectionTitle}>Available In</h2>
            </div>
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
            description="This DLC doesn't have any associated achievement sets, bundles, or parent game."
          />
        </section>
      )}
    </div>
  );
}
