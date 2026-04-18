"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { GET_GAMES, GET_ME } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  GameCard,
  GroupedGameCard,
  Button,
  LoadingSpinner,
  EmptyState,
  ErrorState,
  CatalogFilterPanel,
  CatalogFilterRow,
  CatalogSearchField,
  CatalogSelectField,
  CatalogHero,
} from "@/components";
import { Gamepad2, Swords, Trophy } from "lucide-react";
import styles from "./page.module.css";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface GameNode {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
  platform?: Platform | null;
}

interface GameGroup {
  title: string;
  slug: string;
  games: GameNode[];
  platforms: Platform[];
  coverUrl: string | null;
  totalAchievementCount: number;
  totalTrophyCount: number;
}

interface GameFilter {
  search?: string;
  platformId?: string;
  hasAchievements?: boolean;
}

function groupGamesByTitle(games: GameNode[]): GameGroup[] {
  const groups = new Map<string, GameNode[]>();

  for (const game of games) {
    const key = game.title.trim().toLowerCase();
    const existing = groups.get(key) || [];
    existing.push(game);
    groups.set(key, existing);
  }

  return Array.from(groups.values()).map((gameList) => ({
    title: gameList[0].title,
    slug: encodeURIComponent(gameList[0].title.toLowerCase().replace(/\s+/g, "-")),
    games: gameList,
    platforms: gameList
      .map((g) => g.platform)
      .filter((p): p is Platform => p !== null && p !== undefined),
    coverUrl: gameList.find((g) => g.coverUrl)?.coverUrl ?? null,
    totalAchievementCount: gameList.reduce((sum, g) => sum + g.achievementCount, 0),
    totalTrophyCount: gameList.reduce((sum, g) => sum + g.trophyCount, 0),
  }));
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
  const platforms: Platform[] = platformsData?.platforms ?? [];

  const filter = useMemo(() => {
    const nextFilter: GameFilter = {};
    if (searchQuery) nextFilter.search = searchQuery;
    if (platformId) nextFilter.platformId = platformId;
    if (hasAchievements === "with") nextFilter.hasAchievements = true;
    if (hasAchievements === "without") nextFilter.hasAchievements = false;
    return Object.keys(nextFilter).length > 0 ? nextFilter : undefined;
  }, [searchQuery, platformId, hasAchievements]);

  const { data, loading, error, fetchMore } = useQuery(GET_GAMES, {
    variables: {
      first: 24,
      filter,
      orderBy,
    },
  });

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";

  const rawGames = data?.games?.edges;
  const hasMore = data?.games?.pageInfo?.hasNextPage || false;
  const endCursor = data?.games?.pageInfo?.endCursor;

  // Group games by title for consolidated display
  const gameGroups = useMemo(() => {
    if (!rawGames) return [];
    const gameNodes = rawGames.map(({ node }: { node: GameNode }) => node);
    return groupGamesByTitle(gameNodes);
  }, [rawGames]);
  const totalGames = data?.games?.totalCount || 0;
  const trophyRichGroups = gameGroups.filter((group) => group.totalTrophyCount > 0).length;
  const multiPlatformGroups = gameGroups.filter((group) => group.games.length > 1).length;

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
      <CatalogHero
        classes={{
          root: styles.hero,
          top: styles.heroTop,
          lead: styles.heroLead,
          eyebrow: styles.eyebrow,
          titleRow: styles.titleRow,
          title: styles.title,
          titleMeta: styles.subtitle,
          description: styles.description,
          stats: styles.heroStats,
          stat: styles.heroStat,
        }}
        eyebrow={
          <>
            <Gamepad2 size={16} />
            <span>Catalog Browser</span>
          </>
        }
        title="Games Library"
        titleMeta={`${totalGames} games`}
        description="Browse the full library, compare platform variants, and surface the games with the richest achievement support."
        action={isSignedIn && isAdmin ? <Button href="/games/new">Add Game</Button> : undefined}
        stats={[
          {
            icon: <Gamepad2 size={16} />,
            label: `${gameGroups.length} visible title groups`,
          },
          {
            icon: <Swords size={16} />,
            label: `${multiPlatformGroups} multi-platform entries`,
          },
          {
            icon: <Trophy size={16} />,
            label: `${trophyRichGroups} with trophies`,
          },
        ]}
      />

      <CatalogFilterPanel
        eyebrow="Refine Results"
        title="Search and Filter"
        showClear={Boolean(searchQuery || platformId || hasAchievements !== "all")}
        onClear={() => {
          setSearchQuery("");
          setPlatformId("");
          setHasAchievements("all");
          setOrderBy("TITLE_ASC");
        }}
      >
        <CatalogFilterRow>
          <CatalogSearchField
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <CatalogSelectField
            value={platformId}
            onChange={(e) => setPlatformId(e.target.value)}
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </CatalogSelectField>
          <CatalogSelectField
            value={hasAchievements}
            onChange={(e) =>
              setHasAchievements(e.target.value as "all" | "with" | "without")
            }
          >
            <option value="all">All</option>
            <option value="with">With Achievements</option>
            <option value="without">Without Achievements</option>
          </CatalogSelectField>
          <CatalogSelectField value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
            <option value="TITLE_ASC">Title (A → Z)</option>
            <option value="TITLE_DESC">Title (Z → A)</option>
            <option value="CREATED_AT_DESC">Newest</option>
            <option value="CREATED_AT_ASC">Oldest</option>
            <option value="ACHIEVEMENT_COUNT_DESC">Most Achievements</option>
            <option value="TROPHY_COUNT_DESC">Most Trophies</option>
          </CatalogSelectField>
        </CatalogFilterRow>
      </CatalogFilterPanel>

      {/* Loading */}
      {loading && (!rawGames || rawGames.length === 0) && (
        <LoadingSpinner text="Loading games..." />
      )}

      {/* Error */}
      {error && (
        <ErrorState
          title="Couldn’t load the games catalog"
          description={error.message}
          action={
            <Button onClick={() => window.location.reload()} variant="secondary">
              Try Again
            </Button>
          }
        />
      )}

      {/* Games Grid */}
      {gameGroups.length > 0 && (
        <>
          <div className={styles.gamesGrid}>
            {gameGroups.map((group) =>
              group.games.length === 1 ? (
                <GameCard
                  key={group.games[0].id}
                  id={group.games[0].id}
                  title={group.games[0].title}
                  description={group.games[0].description}
                  coverUrl={group.games[0].coverUrl}
                  achievementCount={group.games[0].achievementCount}
                  trophyCount={group.games[0].trophyCount}
                  platform={group.games[0].platform}
                />
              ) : (
                <GroupedGameCard
                  key={group.slug}
                  title={group.title}
                  slug={group.slug}
                  coverUrl={group.coverUrl}
                  platforms={group.platforms}
                  totalAchievementCount={group.totalAchievementCount}
                  totalTrophyCount={group.totalTrophyCount}
                />
              )
            )}
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
      {!loading && (!rawGames || rawGames.length === 0) && (
        <EmptyState
          icon={<Gamepad2 size={48} />}
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
