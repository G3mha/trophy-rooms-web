"use client";

import { use } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import {
  BookmarkPlus,
  ShoppingCart,
  Gamepad2,
  Package,
  Box,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  User,
  DollarSign,
  StickyNote,
} from "lucide-react";
import { GET_USER_BUYLIST, GET_USER } from "@/graphql/queries";
import { LoadingSpinner, EmptyState, AppImage, Button } from "@/components";
import styles from "./page.module.css";

interface BuylistItem {
  id: string;
  userId: string;
  gameId: string | null;
  dlcId: string | null;
  bundleId: string | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  notes: string | null;
  estimatedPrice: number | null;
  itemType: "GAME" | "DLC" | "BUNDLE";
  displayTitle: string;
  displayCoverUrl: string | null;
  addedAt: string;
  updatedAt: string;
}

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f97316",
  LOW: "#22c55e",
};

const ITEM_TYPE_COLORS: Record<string, string> = {
  GAME: "#3b82f6",
  DLC: "#8b5cf6",
  BUNDLE: "#ec4899",
};

export default function PublicBuylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_USER, {
    variables: { id },
  });

  const { data: buylistData, loading: buylistLoading } = useQuery(
    GET_USER_BUYLIST,
    {
      variables: { userId: id, orderBy: "PRIORITY_DESC" },
    }
  );

  const loading = userLoading || buylistLoading;
  const user = userData?.user;
  const items: BuylistItem[] = buylistData?.userBuylist || [];

  // Calculate totals
  const totalItems = items.length;
  const totalEstimatedCost = items.reduce(
    (sum, item) => sum + (item.estimatedPrice || 0),
    0
  );
  const highPriorityCount = items.filter((i) => i.priority === "HIGH").length;

  const getPriorityLabel = (priority: string): string => {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
  };

  const getPriorityIcon = (priority: string): IconComponent => {
    switch (priority) {
      case "HIGH":
        return ArrowUp;
      case "MEDIUM":
        return ArrowRight;
      case "LOW":
        return ArrowDown;
      default:
        return ArrowRight;
    }
  };

  const getItemTypeLabel = (type: string): string => {
    switch (type) {
      case "GAME":
        return "Game";
      case "DLC":
        return "DLC";
      case "BUNDLE":
        return "Bundle";
      default:
        return type;
    }
  };

  const getItemTypeIcon = (type: string): IconComponent => {
    switch (type) {
      case "GAME":
        return Gamepad2;
      case "DLC":
        return Package;
      case "BUNDLE":
        return Box;
      default:
        return Gamepad2;
    }
  };

  const getItemLink = (item: BuylistItem): string => {
    if (item.gameId) return `/games/${item.gameId}`;
    if (item.dlcId) return `/dlcs/${item.dlcId}`;
    if (item.bundleId) return `/bundles/${item.bundleId}`;
    return "#";
  };

  const formatPrice = (price: number | null): string => {
    if (price === null) return "—";
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading buylist..." />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon={<User size={48} />}
          title="User not found"
          description="This user doesn't exist or their profile is not available."
          action={<Button href="/games">Browse Games</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <ShoppingCart size={14} />
            <span>Shared Buylist</span>
          </div>
          <h1 className={styles.title}>
            {user.name || user.email}&apos;s Buylist
          </h1>
          <p className={styles.subtitle}>
            Games, DLCs, and bundles they want to pick up or receive as gifts.
          </p>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{totalItems}</span>
              <span className={styles.statLabel}>Items</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>${totalEstimatedCost.toFixed(2)}</span>
              <span className={styles.statLabel}>Estimated Total</span>
            </div>
            <div className={styles.statCard}>
              <span
                className={styles.statValue}
                style={{ color: PRIORITY_COLORS.HIGH }}
              >
                {highPriorityCount}
              </span>
              <span className={styles.statLabel}>High Priority</span>
            </div>
          </div>
        </div>
        <div className={styles.heroSidebar}>
          <div className={styles.contextCard}>
            <div className={styles.contextHeader}>
              <div className={styles.contextLabel}>
                <BookmarkPlus size={14} />
                <span>Share Context</span>
              </div>
              <Link href={`/users/${id}`} className={styles.profileLink}>
                <User size={16} />
                <span>View Profile</span>
              </Link>
            </div>
            <p className={styles.contextCopy}>
              Use this page as a quick reference for gifting ideas, backlog help, or wishlist comparisons.
            </p>
          </div>
        </div>
      </header>

      {items.length > 0 ? (
        <section className={styles.sectionPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Wishlist</p>
              <h2 className={styles.sectionTitle}>Wanted Items</h2>
            </div>
            <span className={styles.countPill}>{items.length}</span>
          </div>
          <div className={styles.itemsGrid}>
          {items.map((item) => {
            const PriorityIcon = getPriorityIcon(item.priority);
            const ItemTypeIcon = getItemTypeIcon(item.itemType);
            return (
              <div key={item.id} className={styles.itemCard}>
                <Link href={getItemLink(item)} className={styles.itemLink}>
                  <div className={styles.coverContainer}>
                    <AppImage
                      src={item.displayCoverUrl}
                      alt={item.displayTitle}
                      className={styles.cover}
                      fallback={
                        <div className={styles.coverPlaceholder}>
                          <ItemTypeIcon size={32} />
                        </div>
                      }
                    />
                    <div
                      className={styles.priorityBadge}
                      style={
                        {
                          "--badge-color": PRIORITY_COLORS[item.priority],
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.badgeIcon}>
                        <PriorityIcon size={12} />
                      </span>
                      <span className={styles.badgeLabel}>
                        {getPriorityLabel(item.priority)}
                      </span>
                    </div>
                    <div
                      className={styles.typeBadge}
                      style={
                        {
                          "--badge-color": ITEM_TYPE_COLORS[item.itemType],
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.badgeIcon}>
                        <ItemTypeIcon size={12} />
                      </span>
                      <span className={styles.badgeLabel}>
                        {getItemTypeLabel(item.itemType)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.itemTitle}>{item.displayTitle}</h3>
                    {item.estimatedPrice !== null && (
                      <div className={styles.priceBadge}>
                        <DollarSign size={12} />
                        <span>{formatPrice(item.estimatedPrice)}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className={styles.notes}>
                        <StickyNote size={12} />
                        <span>{item.notes}</span>
                      </div>
                    )}
                    <div className={styles.itemMeta}>
                      <span className={styles.addedDate}>
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
          </div>
        </section>
      ) : (
        <section className={styles.sectionPanel}>
          <EmptyState
            icon={<ShoppingCart size={48} />}
            title="Buylist is empty"
            description="This user hasn't added any items to their buylist yet."
            action={
              <Button href={`/users/${id}`} variant="secondary">
                View Profile
              </Button>
            }
          />
        </section>
      )}
    </div>
  );
}
