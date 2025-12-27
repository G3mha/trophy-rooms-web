"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { GET_GAMES } from "@/graphql/queries";
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

  const { data, loading, error, fetchMore } = useQuery(GET_GAMES, {
    variables: {
      first: 12,
      filter: searchQuery ? { titleContains: searchQuery } : undefined,
    },
  });

  const games = data?.games?.edges || [];
  const hasMore = data?.games?.pageInfo?.hasNextPage || false;
  const endCursor = data?.games?.pageInfo?.endCursor;

  const handleLoadMore = () => {
    fetchMore({
      variables: {
        after: endCursor,
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
        {isSignedIn && (
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
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className={styles.clearBtn}
          >
            Clear
          </button>
        )}
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
