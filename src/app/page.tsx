"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useAuth } from "@/lib/auth";
import { ArrowRight, ChevronLeft, ChevronRight, Gamepad2, Star, Trophy } from "lucide-react";
import { GET_GAMES, GET_ME } from "@/graphql/queries";
import { GroupedGameCard, AppImage, Button, LoadingSpinner, EmptyState, ErrorState, GlobalSearch, TrophyCase, TrophyShelf } from "@/components";
import styles from "./page.module.css";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface GameNode {
  id: string;
  gameFamilyId: string;
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
  coverUrl: string | null;
  platforms: Platform[];
  totalAchievementCount: number;
  totalTrophyCount: number;
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
    coverUrl: gameList.find((game) => game.coverUrl)?.coverUrl ?? null,
    platforms: gameList
      .map((game) => game.platform)
      .filter((platform): platform is Platform => Boolean(platform)),
    // Achievements belong to the family, so every platform repeats the same count
    totalAchievementCount: Math.max(0, ...gameList.map((game) => game.achievementCount)),
    totalTrophyCount: gameList.reduce((sum, game) => sum + game.trophyCount, 0),
  }));
}

// Two full rows at the widest layout, where the picks grid fits 10 columns
const MAX_PICKS = 20;
const PICK_ROWS = 2;

// The picks grid fits as many columns as its width allows. Reading the live
// count lets the section show whole rows at any screen size.
function useGridColumnCount() {
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(0);

  useLayoutEffect(() => {
    if (!grid) return;

    const measure = () =>
      setColumns(getComputedStyle(grid).gridTemplateColumns.split(" ").length);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [grid]);

  return [setGrid, columns] as const;
}

const HERO_WORDS = ["play", "collect", "love"];
const LONGEST_HERO_WORD = HERO_WORDS.reduce((a, b) => (b.length > a.length ? b : a));

// Types a word, holds it, erases it, then moves to the next. It lives in its
// own component so each keystroke re-renders only the word, not the page.
function TypedWord() {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(HERO_WORDS[0].length);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    // Reduced motion keeps the first word still
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const word = HERO_WORDS[index];
    const complete = !erasing && length === word.length;
    const timer = setTimeout(
      () => {
        if (complete) setErasing(true);
        else if (!erasing) setLength(length + 1);
        else if (length > 0) setLength(length - 1);
        else {
          setErasing(false);
          setIndex((index + 1) % HERO_WORDS.length);
        }
      },
      complete ? 1800 : erasing ? 60 : 110
    );
    return () => clearTimeout(timer);
  }, [index, length, erasing]);

  return (
    <span className={styles.typedSlot}>
      {/* Invisible longest word holds the width so the headline never reflows */}
      <span className={styles.typedSizer}>{LONGEST_HERO_WORD},</span>
      <span className={styles.typedWord}>
        {HERO_WORDS[index].slice(0, length)}
        <span className={styles.typedCaret} />,
      </span>
    </span>
  );
}

const SPOTLIGHT_INTERVAL_MS = 6000;

// The hero cabinet: loops through every featured game without end. It stops
// while the pointer or keyboard focus is on it, and never auto-advances under
// reduced motion - the arrows still switch games by hand.
function HeroSpotlight({ families }: { families: GameGroup[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = families.length;

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(
      () => setIndex((index + 1) % count),
      SPOTLIGHT_INTERVAL_MS
    );
    return () => clearTimeout(timer);
  }, [index, paused, count]);

  const family = families[index % count];

  return (
    <div
      className={styles.heroPanel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <TrophyCase>
        {family && (
          <>
            <Link
              key={family.slug}
              href={`/games/title/${family.slug}`}
              className={styles.shelfCover}
              aria-label={family.title}
            >
              <AppImage src={family.coverUrl} alt="" />
            </Link>
            <div className={styles.shelfInfo}>
              <div key={family.slug} className={styles.spotlightText}>
                <h2 className={styles.spotlightTitle}>{family.title}</h2>
                <p className={styles.spotlightCopy}>
                  {family.platforms.length === 1
                    ? "1 tracked platform"
                    : `${family.platforms.length} tracked platforms`}
                  , {family.totalAchievementCount} achievements
                  {family.totalTrophyCount > 0
                    ? `, and ${family.totalTrophyCount} trophies`
                    : ""}
                  .
                </p>
                <Button href={`/games/title/${family.slug}`} variant="secondary" size="sm">
                  Open Family
                  <ArrowRight size={14} />
                </Button>
              </div>
              {count > 1 && (
                <div className={styles.spotlightNav}>
                  <button
                    type="button"
                    className={styles.spotlightArrow}
                    aria-label="Previous game"
                    onClick={() => setIndex((index - 1 + count) % count)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className={styles.spotlightArrow}
                    aria-label="Next game"
                    onClick={() => setIndex((index + 1) % count)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </TrophyCase>
    </div>
  );
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const { data: meData } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });
  // The API returns one row per platform, so fetch enough rows to group into
  // MAX_PICKS games with every platform included
  const { data, loading, error } = useQuery(GET_GAMES, {
    variables: { first: 60, orderBy: "ACHIEVEMENT_COUNT_DESC" },
  });
  const [setPicksGrid, picksColumns] = useGridColumnCount();

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";
  const rawGames = useMemo(
    () => data?.games?.edges?.map(({ node }: { node: GameNode }) => node) ?? [],
    [data?.games?.edges]
  );
  const featuredFamilies = useMemo(
    () => groupGamesByTitle(rawGames).slice(0, MAX_PICKS),
    [rawGames]
  );
  const spotlightFamilies = featuredFamilies.filter((family) => family.coverUrl);
  const visiblePicks = picksColumns
    ? featuredFamilies.slice(0, picksColumns * PICK_ROWS)
    : featuredFamilies;

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1
            className={styles.heroTitle}
            aria-label={`Every game you ${HERO_WORDS.slice(0, -1).join(", ")} and ${HERO_WORDS.at(-1)}, in one place.`}
          >
            <span aria-hidden="true">
              Every game you <TypedWord />
              <span className={styles.heroTitleLine}>in one place.</span>
            </span>
          </h1>
          <p className={styles.heroSubtitle}>
            Track achievements, platform variants, and turn your backlog,
            buylist, and collection into a single place.
          </p>
          <GlobalSearch className={styles.heroSearch} />
          {/* Signed-out visitors already have Sign In and Sign Up in the header */}
          {isSignedIn && (
            <div className={styles.heroActions}>
              <Button href="/games" size="lg">
                Browse Games
              </Button>
              <Button href="/dashboard" variant="outline" size="lg">
                My Dashboard
              </Button>
            </div>
          )}
        </div>
        <HeroSpotlight families={spotlightFamilies} />
      </section>

      <section className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={`${styles.sectionTitle} ${styles.picksTitle}`}>Start Somewhere Good</h2>
          <div className={styles.sectionHeaderActions}>
            <Button href="/games" variant="outline" size="sm">
              View All
            </Button>
          </div>
        </div>

        {loading && <LoadingSpinner text="Loading featured titles..." />}

        {error && (
          <ErrorState
            title="Couldn’t load featured titles"
            description={error.message}
            action={
              <Button onClick={() => window.location.reload()} variant="secondary">
                Try Again
              </Button>
            }
          />
        )}

        {featuredFamilies.length > 0 && (
          <div ref={setPicksGrid} className={styles.gamesGrid}>
            {visiblePicks.map((family) => (
              <GroupedGameCard
                key={family.slug}
                title={family.title}
                slug={family.slug}
                coverUrl={family.coverUrl}
                platforms={family.platforms}
                totalAchievementCount={family.totalAchievementCount}
                totalTrophyCount={family.totalTrophyCount}
              />
            ))}
          </div>
        )}

        {data?.games?.totalCount === 0 && (
          <EmptyState
            icon={<Gamepad2 size={48} />}
            title="No games yet"
            description="Be the first to add a game to the collection!"
            action={
              isSignedIn && isAdmin ? (
                <Button href="/games/new">Add First Game</Button>
              ) : isSignedIn ? (
                <Button href="/games">Browse Games</Button>
              ) : (
                <Button href="/sign-up">Sign Up to Add Games</Button>
              )
            }
          />
        )}
      </section>

      <section className={styles.features}>
        <div className={styles.sectionIntro}>
          <h2 className={styles.sectionTitle}>One place for the whole game loop</h2>
          <p className={styles.sectionCopy}>
            Trophy Rooms keeps discovery, ownership, and completion in the same rhythm so your
            progress does not get fragmented by platform.
          </p>
        </div>
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Gamepad2 size={28} />
            </div>
            <h3 className={styles.featureTitle}>Track Games</h3>
            <p className={styles.featureDescription}>
              Group platform variants, browse full game families, and keep the library readable.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Star size={28} />
            </div>
            <h3 className={styles.featureTitle}>Shape Your Challenges</h3>
            <p className={styles.featureDescription}>
              Follow official sets, build custom challenge lists, and keep rare runs visible.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Trophy size={28} />
            </div>
            <h3 className={styles.featureTitle}>Show Completion</h3>
            <p className={styles.featureDescription}>
              Turn finished hunts into trophies, public profile moments, and dashboard milestones.
            </p>
          </div>
        </div>
      </section>
      <TrophyShelf />
    </div>
  );
}
