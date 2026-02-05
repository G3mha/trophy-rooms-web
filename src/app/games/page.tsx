"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { GET_GAMES, GET_ME } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import { GameCard, Button, LoadingSpinner, EmptyState } from "@/components";
import styles from "./page.module.css";

interface GameNode {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
}

export default function GamesPage() {
  const { isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [hasAchievements, setHasAchievements] = useState<"all" | "with" | "without">("all");
  const [orderBy, setOrderBy] = useState(
    "TITLE_ASC"
  );

  const { data: meData } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });

  const { data: platformsData } = useQuery(GET_PLATFORMS);

  const filter = useMemo(() => {
    const nextFilter: Record<string, any> = {};
    if (searchQuery) nextFilter.search = searchQuery;
    if (platformId) nextFilter.platformId = platformId;
    if (hasAchievements === "with") nextFilter.hasAchievements = true;
    if (hasAchievements === "without") nextFilter.hasAchievements = false;
    return Object.keys(nextFilter).length > 0 ? nextFilter : undefined;
  }, [searchQuery, platformId, hasAchievements]);

  const { data, loading, error, fetchMore } = useQuery(GET_GAMES, {
    variables: {
      first: 12,
      filter,
      orderBy,
    },
  });

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";

  const games = data?.games?.edges || [];
  const hasMore = data?.games?.pageInfo?.hasNextPage || false;
  const endCursor = data?.games?.pageInfo?.endCursor;

  const handleLoadMore = () => {
    fetchMore({
      variables: {
        after: endCursor,
        filter,
        orderBy,
      },
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Games Library</h1>
          <p className={styles.subtitle}>
            {data?.games?.totalCount || 0} games available
          </p>
        </div>
        {isSignedIn && isAdmin && (
          <Button href="/games/new">Add Game</Button>
        )}
      </header>

      {/* Search */}
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {(searchQuery || platformId || hasAchievements !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setPlatformId("");
              setHasAchievements("all");
              setOrderBy("TITLE_ASC");
            }}
            className={styles.clearBtn}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Platform</label>
          <select
            className={styles.filterSelect}
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
          >
            <option value="">All Platforms</option>
            {platformsData?.platforms?.map((platform: any) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Achievements</label>
          <select
            className={styles.filterSelect}
            value={hasAchievements}
            onChange={(e) =>
              setHasAchievements(e.target.value as "all" | "with" | "without")
            }
          >
            <option value="all">All</option>
            <option value="with">With Achievements</option>
            <option value="without">Without Achievements</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort</label>
          <select
            className={styles.filterSelect}
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
          >
            <option value="TITLE_ASC">Title (A → Z)</option>
            <option value="TITLE_DESC">Title (Z → A)</option>
            <option value="CREATED_AT_DESC">Newest</option>
            <option value="CREATED_AT_ASC">Oldest</option>
            <option value="ACHIEVEMENT_COUNT_DESC">Most Achievements</option>
            <option value="TROPHY_COUNT_DESC">Most Trophies</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && games.length === 0 && (
        <LoadingSpinner text="Loading games..." />
      )}

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <p>Error loading games: {error.message}</p>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Try Again
          </Button>
        </div>
      )}

      {/* Games Grid */}
      {games.length > 0 && (
        <>
          <div className={styles.gamesGrid}>
            {games.map(({ node: game }: { node: GameNode }) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                description={game.description}
                coverUrl={game.coverUrl}
                achievementCount={game.achievementCount}
                trophyCount={game.trophyCount}
              />
            ))}
          </div>

          {hasMore && (
            <div className={styles.loadMore}>
              <Button
                onClick={handleLoadMore}
                variant="secondary"
                loading={loading}
              >
                Load More Games
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && games.length === 0 && (
        <EmptyState
          icon="🎮"
          title={searchQuery ? "No games found" : "No games yet"}
          description={
            searchQuery
              ? `No games match "${searchQuery}". Try a different search.`
              : "Be the first to add a game to the library!"
          }
          action={
            searchQuery ? (
              <Button onClick={() => setSearchQuery("")} variant="secondary">
                Clear Search
              </Button>
            ) : isSignedIn ? (
              <Button href="/games/new">Add First Game</Button>
            ) : (
              <Button href="/sign-up">Sign Up to Add Games</Button>
            )
          }
        />
      )}
    </div>
  );
}
