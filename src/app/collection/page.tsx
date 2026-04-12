"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import {
  Package,
  Lock,
  CheckCircle,
  Globe,
  Plus,
} from "lucide-react";
import {
  GET_MY_COLLECTION,
  GET_COLLECTION_STATS,
} from "@/graphql/queries";
import { REMOVE_FROM_COLLECTION } from "@/graphql/mutations";
import {
  LoadingSpinner,
  EmptyState,
  Button,
  CollectionItemCard,
  AddToCollectionModal,
  FilterTabs,
  type FilterTab,
} from "@/components";
import type { GameRegion } from "@/components/CollectionItemCard";
import styles from "./page.module.css";

interface Game {
  id: string;
  title: string;
  coverUrl?: string | null;
}

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface CollectionItem {
  id: string;
  gameId: string;
  game: Game;
  platformId?: string | null;
  platform?: Platform | null;
  hasDisc: boolean;
  hasBox: boolean;
  hasManual: boolean;
  hasExtras: boolean;
  isDigital: boolean;
  isSealed: boolean;
  region: GameRegion;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RegionCount {
  region: GameRegion;
  count: number;
}

interface CollectionStats {
  totalItems: number;
  sealedCount: number;
  completeCount: number;
  byRegion: RegionCount[];
}

type FilterRegion = GameRegion | "ALL";
type FilterType = "ALL" | "SEALED" | "COMPLETE";

const REGION_TAB_CONFIG: { label: string; value: FilterRegion }[] = [
  { label: "All", value: "ALL" },
  { label: "NTSC-U", value: "NTSC_U" },
  { label: "PAL", value: "PAL" },
  { label: "NTSC-J", value: "NTSC_J" },
  { label: "Other", value: "OTHER" },
];

export default function CollectionPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [regionFilter, setRegionFilter] = useState<FilterRegion>("ALL");
  const [typeFilter, setTypeFilter] = useState<FilterType>("ALL");
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryVariables: {
    region?: GameRegion;
    isSealed?: boolean;
    isComplete?: boolean;
  } = {};

  if (regionFilter !== "ALL") {
    queryVariables.region = regionFilter;
  }
  if (typeFilter === "SEALED") {
    queryVariables.isSealed = true;
  }
  if (typeFilter === "COMPLETE") {
    queryVariables.isComplete = true;
  }

  const { data, loading } = useQuery(GET_MY_COLLECTION, {
    variables: queryVariables,
    skip: !isSignedIn,
  });

  const { data: statsData } = useQuery(GET_COLLECTION_STATS, {
    skip: !isSignedIn,
  });

  const [removeFromCollection] = useMutation(
    REMOVE_FROM_COLLECTION,
    {
      refetchQueries: [
        { query: GET_MY_COLLECTION },
        { query: GET_COLLECTION_STATS },
      ],
      onCompleted: () => toast.success("Item removed from collection."),
      onError: (error) => toast.error(error.message || "Failed to remove item."),
    }
  );

  const items: CollectionItem[] = data?.myCollection || [];
  const stats: CollectionStats = statsData?.collectionStats || {
    totalItems: 0,
    sealedCount: 0,
    completeCount: 0,
    byRegion: [],
  };

  // Build region tabs with counts from stats (must be before early returns)
  const regionTabs: FilterTab<FilterRegion>[] = useMemo(() => {
    return REGION_TAB_CONFIG.map((tab) => ({
      ...tab,
      icon: tab.value !== "ALL" ? Globe : undefined,
      count:
        tab.value === "ALL"
          ? stats.totalItems
          : stats.byRegion.find((r) => r.region === tab.value)?.count || 0,
    }));
  }, [stats]);

  if (!isLoaded) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading your collection..." />
      </div>
    );
  }

  const handleRemove = async (id: string) => {
    if (confirm("Are you sure you want to remove this item from your collection?")) {
      await removeFromCollection({ variables: { id } });
    }
  };

  const handleEdit = (item: CollectionItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>My Collection</h1>
          <p className={styles.subtitle}>
            Catalog your physical game collection
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <Package size={16} />
          <span>{stats.totalItems} items</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <Lock size={16} />
          <span>{stats.sealedCount} sealed</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <CheckCircle size={16} />
          <span>{stats.completeCount} complete</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {/* Region Tabs */}
        <FilterTabs
          tabs={regionTabs}
          value={regionFilter}
          onChange={setRegionFilter}
          iconSize={14}
          className={styles.tabs}
        />

        {/* Type Filters */}
        <div className={styles.typeFilters}>
          <button
            className={`${styles.typeFilter} ${typeFilter === "ALL" ? styles.typeFilterActive : ""}`}
            onClick={() => setTypeFilter("ALL")}
          >
            All
          </button>
          <button
            className={`${styles.typeFilter} ${typeFilter === "SEALED" ? styles.typeFilterActive : ""}`}
            onClick={() => setTypeFilter("SEALED")}
          >
            <Lock size={14} />
            Sealed Only
          </button>
          <button
            className={`${styles.typeFilter} ${typeFilter === "COMPLETE" ? styles.typeFilterActive : ""}`}
            onClick={() => setTypeFilter("COMPLETE")}
          >
            <CheckCircle size={14} />
            Complete Only
          </button>
        </div>
      </div>

      {/* Collection Grid */}
      {items.length > 0 ? (
        <div className={styles.grid}>
          {items.map((item) => (
            <CollectionItemCard
              key={item.id}
              game={item.game}
              platform={item.platform}
              hasDisc={item.hasDisc}
              hasBox={item.hasBox}
              hasManual={item.hasManual}
              hasExtras={item.hasExtras}
              isSealed={item.isSealed}
              region={item.region}
              notes={item.notes}
              onEdit={() => handleEdit(item)}
              onRemove={() => handleRemove(item.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Package size={48} />}
          title={
            regionFilter === "ALL" && typeFilter === "ALL"
              ? "Your collection is empty"
              : "No items match your filters"
          }
          description={
            regionFilter === "ALL" && typeFilter === "ALL"
              ? "Start cataloging your physical game collection. Track what components you have, region, and condition."
              : "Try adjusting your filters to see more items."
          }
          action={
            regionFilter === "ALL" && typeFilter === "ALL" ? (
              <Button href="/games">
                <Plus size={16} />
                Browse Games to Add
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setRegionFilter("ALL");
                  setTypeFilter("ALL");
                }}
                variant="secondary"
              >
                Clear Filters
              </Button>
            )
          }
        />
      )}

      {/* Edit Modal */}
      {editingItem && (
        <AddToCollectionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          game={editingItem.game}
          editingItem={editingItem}
        />
      )}
    </div>
  );
}
