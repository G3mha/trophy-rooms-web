"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_BUNDLES } from "@/graphql/admin_queries";
import { BundleCard, Button, LoadingSpinner, EmptyState } from "@/components";
import { ChevronDown, Package } from "lucide-react";
import styles from "./page.module.css";

interface Bundle {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  coverUrl?: string | null;
  gameCount: number;
  dlcCount: number;
}

const bundleTypes = [
  { value: "", label: "All Types" },
  { value: "BUNDLE", label: "Bundle" },
  { value: "SEASON_PASS", label: "Season Pass" },
  { value: "COLLECTION", label: "Collection" },
  { value: "SUBSCRIPTION", label: "Subscription" },
];

export default function BundlesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bundleType, setBundleType] = useState("");

  const { data, loading, error } = useQuery(GET_BUNDLES, {
    variables: bundleType ? { type: bundleType } : {},
  });

  const bundles: Bundle[] = useMemo(() => data?.bundles || [], [data?.bundles]);

  const filteredBundles = useMemo(() => {
    if (!searchQuery) return bundles;
    const query = searchQuery.toLowerCase();
    return bundles.filter((bundle: Bundle) =>
      bundle.name.toLowerCase().includes(query)
    );
  }, [bundles, searchQuery]);

  const hasActiveFilters = searchQuery || bundleType;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            Bundles
            <span className={styles.subtitle}>
              {filteredBundles.length} {filteredBundles.length === 1 ? "bundle" : "bundles"}
            </span>
          </h1>
        </div>
      </header>

      {/* Search and Filters */}
      <div className={styles.filtersRow}>
        <input
          type="text"
          placeholder="Search bundles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.selectWrapper}>
          <select
            className={styles.filterSelect}
            value={bundleType}
            onChange={(e) => setBundleType(e.target.value)}
          >
            {bundleTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <ChevronDown className={styles.selectIcon} size={16} />
        </div>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearchQuery("");
              setBundleType("");
            }}
            className={styles.clearBtn}
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <LoadingSpinner text="Loading bundles..." />
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <p>Error loading bundles: {error.message}</p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Try Again
          </Button>
        </div>
      )}

      {/* Bundles Grid */}
      {!loading && !error && filteredBundles.length > 0 && (
        <div className={styles.bundlesGrid}>
          {filteredBundles.map((bundle: Bundle) => (
            <BundleCard
              key={bundle.id}
              id={bundle.id}
              name={bundle.name}
              type={bundle.type}
              description={bundle.description}
              coverUrl={bundle.coverUrl}
              gameCount={bundle.gameCount}
              dlcCount={bundle.dlcCount}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredBundles.length === 0 && (
        <EmptyState
          icon={<Package size={48} />}
          title={searchQuery ? "No bundles found" : "No bundles yet"}
          description={
            searchQuery
              ? `No bundles match "${searchQuery}". Try a different search.`
              : "Browse available game bundles, season passes, and collections."
          }
          action={
            searchQuery ? (
              <Button onClick={() => setSearchQuery("")} variant="secondary">
                Clear Search
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
