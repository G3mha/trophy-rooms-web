"use client";

import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Gamepad2, Search, Star, Trophy } from "lucide-react";
import { GET_GAMES, GET_ME } from "@/graphql/queries";
import { GameCard, AppImage, Button, LoadingSpinner, EmptyState, ErrorState, GlobalSearch } from "@/components";
import styles from "./page.module.css";

interface GameNode {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const { data: meData } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });
  const { data, loading, error } = useQuery(GET_GAMES, {
    variables: { first: 40 },
  });

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";
  const featuredGames = data?.games?.edges?.slice(0, 12) ?? [];
  const totalGames = data?.games?.totalCount ?? 0;
  const trophyGames = featuredGames.filter(
    ({ node }: { node: GameNode }) => node.trophyCount > 0
  ).length;
  const achievementRichGames = featuredGames.filter(
    ({ node }: { node: GameNode }) => node.achievementCount >= 10
  ).length;
  const spotlightGame = featuredGames[0]?.node;

  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}>
            <Trophy size={14} />
            <span>Cross-Platform Achievement Tracking</span>
          </div>
          <h1 className={styles.heroTitle}>
            Build a trophy room that actually feels like a gaming archive.
          </h1>
          <p className={styles.heroSubtitle}>
            Track achievements, surface platform variants, and turn your backlog,
            buylist, and collection into one coherent place.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <Gamepad2 size={16} />
              <span>{totalGames} games indexed</span>
            </div>
            <div className={styles.heroStat}>
              <Trophy size={16} />
              <span>{trophyGames} featured with trophies</span>
            </div>
            <div className={styles.heroStat}>
              <Star size={16} />
              <span>{achievementRichGames} rich achievement profiles</span>
            </div>
          </div>
          <GlobalSearch className={styles.heroSearch} />
          <div className={styles.heroActions}>
            {isSignedIn ? (
              <>
                <Button href="/games" size="lg">
                  Browse Games
                </Button>
                <Button href="/dashboard" variant="outline" size="lg">
                  My Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button href="/sign-up" size="lg">
                  Get Started
                </Button>
                <Button href="/sign-in" variant="outline" size="lg">
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
        <div className={styles.heroPanel}>
          <div className={styles.heroVisual}>
            <AppImage
              src="/hero-platforms.png"
              alt="Trophy Rooms - Track achievements across Nintendo, PlayStation, Xbox, Steam, GOG, and RetroAchievements"
              className={styles.heroImage}
            />
          </div>
          <div className={styles.spotlightCard}>
            <div className={styles.spotlightHeader}>
              <div className={styles.spotlightLabel}>
                <Search size={14} />
                <span>Spotlight</span>
              </div>
              <Button href="/games" variant="ghost" size="sm">
                Explore
              </Button>
            </div>
            {spotlightGame ? (
              <div className={styles.spotlightBody}>
                <AppImage
                  src={spotlightGame.coverUrl}
                  alt={spotlightGame.title}
                  className={styles.spotlightImage}
                />
                <div className={styles.spotlightContent}>
                  <h2 className={styles.spotlightTitle}>{spotlightGame.title}</h2>
                  <p className={styles.spotlightCopy}>
                    {spotlightGame.achievementCount} achievements
                    {spotlightGame.trophyCount > 0
                      ? ` and ${spotlightGame.trophyCount} trophies`
                      : " ready to track"}
                    .
                  </p>
                  <Button href={`/games/${spotlightGame.id}`} variant="secondary" size="sm">
                    Open Game
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <p className={styles.spotlightCopy}>
                Browse the catalog to start curating your own trophy room.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionIntro}>
          <p className={styles.sectionEyebrow}>Why It Works</p>
          <h2 className={styles.sectionTitle}>One place for the whole collecting loop</h2>
          <p className={styles.sectionCopy}>
            Trophy Rooms is not just a game list. It keeps discovery, ownership, and completion
            in the same rhythm so your progress does not get fragmented by platform.
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

      <section className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Featured Catalog</p>
            <h2 className={styles.sectionTitle}>Start Somewhere Good</h2>
          </div>
          <div className={styles.sectionHeaderActions}>
            <span className={styles.countPill}>{featuredGames.length || 0} picks</span>
            <Button href="/games" variant="outline" size="sm">
              View All
            </Button>
          </div>
        </div>

        {loading && <LoadingSpinner text="Loading games..." />}

        {error && (
          <ErrorState
            title="Couldn’t load featured games"
            description={error.message}
            action={
              <Button onClick={() => window.location.reload()} variant="secondary">
                Try Again
              </Button>
            }
          />
        )}

        {featuredGames.length > 0 && (
          <div className={styles.gamesGrid}>
            {featuredGames.map(({ node: game }: { node: GameNode }) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                description={game.description}
                coverUrl={game.coverUrl}
                achievementCount={game.achievementCount}
                trophyCount={game.trophyCount}
                compact
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
    </div>
  );
}
