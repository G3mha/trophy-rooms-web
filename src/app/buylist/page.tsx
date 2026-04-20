"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";
import {
  ShoppingCart,
  Gamepad2,
  Package,
  Box,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  X,
  Check,
  Share2,
  DollarSign,
  StickyNote,
  Gift,
  Sparkles,
} from "lucide-react";
import { GET_MY_BUYLIST, GET_BUYLIST_STATS } from "@/graphql/queries";
import { REMOVE_FROM_BUYLIST } from "@/graphql/mutations";
import {
  LoadingSpinner,
  EmptyState,
  AppImage,
  Button,
  FilterTabs,
  CatalogFilterPanel,
  CatalogHero,
  SummaryStats,
  type FilterTab,
} from "@/components";
import { MarkAsPurchasedModal } from "@/components/MarkAsPurchasedModal";
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

interface BuylistStats {
  totalItems: number;
  totalEstimatedCost: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  gameCount: number;
  dlcCount: number;
  bundleCount: number;
}

type PriorityFilter = "HIGH" | "MEDIUM" | "LOW" | "ALL";
type ItemTypeFilter = "GAME" | "DLC" | "BUNDLE" | "ALL";
type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

const PRIORITY_TABS: FilterTab<PriorityFilter>[] = [
  { label: "All Priorities", icon: ShoppingCart, value: "ALL" },
  { label: "High", icon: ArrowUp, value: "HIGH" },
  { label: "Medium", icon: ArrowRight, value: "MEDIUM" },
  { label: "Low", icon: ArrowDown, value: "LOW" },
];

const ITEM_TYPE_TABS: FilterTab<ItemTypeFilter>[] = [
  { label: "All Types", icon: ShoppingCart, value: "ALL" },
  { label: "Games", icon: Gamepad2, value: "GAME" },
  { label: "DLCs", icon: Package, value: "DLC" },
  { label: "Bundles", icon: Box, value: "BUNDLE" },
];

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

export default function BuylistPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [itemTypeFilter, setItemTypeFilter] = useState<ItemTypeFilter>("ALL");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPurchasedModal, setShowPurchasedModal] = useState(false);
  const [selectedItemForPurchase, setSelectedItemForPurchase] =
    useState<BuylistItem | null>(null);

  const queryVariables = {
    filter: {
      ...(priorityFilter !== "ALL" && { priority: priorityFilter }),
      ...(itemTypeFilter !== "ALL" && { itemType: itemTypeFilter }),
    },
    orderBy: "ADDED_AT_DESC",
  };

  const { data, loading, refetch } = useQuery(GET_MY_BUYLIST, {
    variables: queryVariables,
    skip: !isSignedIn,
  });

  const { data: statsData } = useQuery(GET_BUYLIST_STATS, {
    skip: !isSignedIn,
  });

  const [removeFromBuylist, { loading: removing }] = useMutation(
    REMOVE_FROM_BUYLIST,
    {
      onCompleted: () => {
        refetch();
        toast.success("Item removed from buylist.");
      },
      onError: (error) => toast.error(error.message || "Failed to remove item."),
    }
  );

  if (!isLoaded) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading your buylist..." />
      </div>
    );
  }

  const items: BuylistItem[] = data?.myBuylist || [];
  const stats: BuylistStats | null = statsData?.buylistStats || null;
  const totalGames = stats?.gameCount || 0;
  const totalDlcs = stats?.dlcCount || 0;
  const totalBundles = stats?.bundleCount || 0;

  const handleRemove = async (id: string) => {
    await removeFromBuylist({ variables: { id } });
  };

  const handleMarkPurchased = (item: BuylistItem) => {
    setSelectedItemForPurchase(item);
    setShowPurchasedModal(true);
  };

  const handleShare = async () => {
    if (!userId) {
      toast.error("Unable to build your public buylist link right now.");
      return;
    }

    const shareUrl = `${window.location.origin}/users/${userId}/buylist`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Buylist link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const getPriorityLabel = (priority: string): string =>
    priority.charAt(0) + priority.slice(1).toLowerCase();

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

  const formatPrice = (price: number | null): string =>
    price === null ? "—" : `$${price.toFixed(2)}`;

  return (
    <div className={styles.container}>
      <CatalogHero
        classes={{
          root: styles.hero,
          top: styles.heroTop,
          lead: styles.heroLead,
          eyebrow: styles.eyebrow,
          title: styles.title,
          description: styles.subtitle,
          stats: styles.heroStats,
          stat: styles.heroStat,
        }}
        eyebrow={
          <>
            <Sparkles size={16} />
            <span>Wish List Planner</span>
          </>
        }
        title="My Buylist"
        description="Keep your most wanted games, DLCs, and bundles in one place, with priorities and prices ready when it&apos;s time to buy."
        action={
          <button
            className={styles.shareButton}
            onClick={handleShare}
            title="Share your buylist"
          >
            {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copiedLink ? "Copied!" : "Share List"}</span>
          </button>
        }
        stats={
          stats && stats.totalItems > 0
            ? [
                {
                  icon: <ShoppingCart size={16} />,
                  label: `${stats.totalItems} total wants`,
                },
                {
                  icon: <DollarSign size={16} />,
                  label: `$${stats.totalEstimatedCost.toFixed(2)} estimated total`,
                },
                {
                  icon: <Gift size={16} />,
                  label: `${stats.highPriorityCount} high priority`,
                },
              ]
            : []
        }
      />

      <SummaryStats
        items={[
          {
            label: "Games",
            value: totalGames,
            text: "Full releases currently on your list.",
          },
          {
            label: "DLCs",
            value: totalDlcs,
            text: "Add-ons and expansions you still want.",
          },
          {
            label: "Bundles",
            value: totalBundles,
            text: "Collections and packages worth tracking.",
          },
        ]}
      />

      <CatalogFilterPanel
        eyebrow="Refine Wishlist"
        title="Priority and Type"
        bodyClassName={styles.filters}
      >
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Priority</span>
            <FilterTabs
              tabs={PRIORITY_TABS}
              value={priorityFilter}
              onChange={setPriorityFilter}
              iconSize={14}
              className={styles.tabs}
            />
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Type</span>
            <FilterTabs
              tabs={ITEM_TYPE_TABS}
              value={itemTypeFilter}
              onChange={setItemTypeFilter}
              iconSize={14}
              className={styles.tabs}
            />
          </div>
      </CatalogFilterPanel>

      {items.length > 0 ? (
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
                      style={{ "--badge-color": PRIORITY_COLORS[item.priority] } as React.CSSProperties}
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
                      style={{ "--badge-color": ITEM_TYPE_COLORS[item.itemType] } as React.CSSProperties}
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
                <div className={styles.cardActions}>
                  <button
                    className={styles.purchasedButton}
                    onClick={() => handleMarkPurchased(item)}
                    title="Mark as purchased"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemove(item.id)}
                    disabled={removing}
                    title="Remove from buylist"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title={
            priorityFilter === "ALL" && itemTypeFilter === "ALL"
              ? "Your buylist is empty"
              : "No items match your filters"
          }
          description={
            priorityFilter === "ALL" && itemTypeFilter === "ALL"
              ? "Browse games, DLCs, and bundles to add them to your buylist."
              : "Try adjusting your filters to see more items."
          }
          action={
            priorityFilter === "ALL" && itemTypeFilter === "ALL" ? (
              <Button href="/games">Browse Games</Button>
            ) : (
              <Button
                onClick={() => {
                  setPriorityFilter("ALL");
                  setItemTypeFilter("ALL");
                }}
                variant="secondary"
              >
                Clear Filters
              </Button>
            )
          }
        />
      )}

      {selectedItemForPurchase && (
        <MarkAsPurchasedModal
          isOpen={showPurchasedModal}
          onClose={() => {
            setShowPurchasedModal(false);
            setSelectedItemForPurchase(null);
          }}
          item={selectedItemForPurchase}
        />
      )}
    </div>
  );
}
