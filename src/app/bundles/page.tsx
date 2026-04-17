"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_BUNDLES } from "@/graphql/admin_queries";
import { BundleCard, Button, LoadingSpinner, EmptyState, ErrorState } from "@/components";
import { ChevronDown, Package, Layers3, Puzzle, Search } from "lucide-react";
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

  const totalGames = filteredBundles.reduce((sum, bundle) => sum + bundle.gameCount, 0);
  const totalDlcs = filteredBundles.reduce((sum, bundle) => sum + bundle.dlcCount, 0);
  const hasActiveFilters = Boolean(searchQuery || bundleType);

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroLead}>
          <div className={styles.eyebrow}>
            <Layers3 size={16} />
            <span>Catalog Overview</span>
          </div>
          <h1 className={styles.title}>Bundles Library</h1>
          <p className={styles.subtitle}>
            Browse collections, season passes, and grouped releases across the
            catalog with a clearer view of what each package contains.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <Package size={16} />
            <span>{filteredBundles.length} bundles in view</span>
          </div>
          <div className={styles.heroStat}>
            <Layers3 size={16} />
            <span>{totalGames} total included titles</span>
          </div>
          <div className={styles.heroStat}>
            <Puzzle size={16} />
            <span>{totalDlcs} total DLC entries</span>
          </div>
        </div>
      </header>

      <section className={styles.filterPanel}>
        <div className={styles.filterHeader}>
          <div>
            <p className={styles.filterEyebrow}>Refine Results</p>
            <h2 className={styles.filterTitle}>Search and Filter</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery("");
                setBundleType("");
              }}
              className={styles.clearBtn}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className={styles.filtersRow}>
          <label className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search bundles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </label>
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
        </div>
      </section>

      {loading && <LoadingSpinner text="Loading bundles..." />}

      {error && (
        <ErrorState
          title="Couldn’t load bundles"
          description={error.message}
          action={
            <Button onClick={() => window.location.reload()} variant="secondary">
              Try Again
            </Button>
          }
        />
      )}

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
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setBundleType("");
                }}
                variant="secondary"
              >
                Clear Search
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
