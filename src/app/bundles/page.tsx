"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_BUNDLES } from "@/graphql/admin_queries";
import {
  BundleCard,
  Button,
  EmptyState,
  CatalogFilterPanel,
  CatalogFilterRow,
  CatalogSearchField,
  CatalogSelectField,
  CatalogHero,
  QueryState,
} from "@/components";
import { Package, Layers3, Puzzle } from "lucide-react";
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
      <CatalogHero
        classes={{
          root: styles.hero,
          lead: styles.heroLead,
          eyebrow: styles.eyebrow,
          title: styles.title,
          description: styles.subtitle,
          stats: styles.heroStats,
          stat: styles.heroStat,
        }}
        eyebrow={
          <>
            <Layers3 size={16} />
            <span>Catalog Overview</span>
          </>
        }
        title="Bundles Library"
        description="Browse collections, season passes, and grouped releases across the catalog with a clearer view of what each package contains."
        stats={[
          {
            icon: <Package size={16} />,
            label: `${filteredBundles.length} bundles in view`,
          },
          {
            icon: <Layers3 size={16} />,
            label: `${totalGames} total included titles`,
          },
          {
            icon: <Puzzle size={16} />,
            label: `${totalDlcs} total DLC entries`,
          },
        ]}
      />

      <CatalogFilterPanel
        eyebrow="Refine Results"
        title="Search and Filter"
        showClear={hasActiveFilters}
        onClear={() => {
          setSearchQuery("");
          setBundleType("");
        }}
      >
        <CatalogFilterRow>
          <CatalogSearchField
            placeholder="Search bundles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <CatalogSelectField
            value={bundleType}
            onChange={(e) => setBundleType(e.target.value)}
            selectClassName={styles.typeSelect}
          >
            {bundleTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </CatalogSelectField>
        </CatalogFilterRow>
      </CatalogFilterPanel>

      <QueryState
        isLoading={loading}
        loadingText="Loading bundles..."
        error={error}
        errorTitle="Couldn’t load bundles"
        errorAction={
          <Button onClick={() => window.location.reload()} variant="secondary">
            Try Again
          </Button>
        }
        isEmpty={!loading && !error && filteredBundles.length === 0}
        emptyState={
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
        }
      >
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
      </QueryState>
    </div>
  );
}
