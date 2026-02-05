"use client";

import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { GET_GAMES, GET_ME } from "@/graphql/queries";
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

export default function Home() {
  const { isSignedIn } = useAuth();
  const { data: meData } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });
  const { data, loading, error } = useQuery(GET_GAMES, {
    variables: { first: 6 },
  });

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Track Your Gaming
            <span className={styles.heroHighlight}> Achievements</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Your personal trophy room across every platform. Track achievements,
            earn trophies, and showcase your gaming legacy.
          </p>
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
        <div className={styles.heroVisual}>
          <div className={styles.trophyDisplay}>
            <span className={styles.trophyIcon}>🏆</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🎮</div>
          <h3 className={styles.featureTitle}>Track Games</h3>
          <p className={styles.featureDescription}>
            Add your favorite games from any platform and organize your collection.
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>⭐</div>
          <h3 className={styles.featureTitle}>Earn Achievements</h3>
          <p className={styles.featureDescription}>
            Complete in-game challenges and mark your achievements as done.
          </p>
        </div>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🏆</div>
          <h3 className={styles.featureTitle}>Collect Trophies</h3>
          <p className={styles.featureDescription}>
            Get all achievements to earn the ultimate trophy for each game.
          </p>
        </div>
      </section>

      {/* Games Section */}
      <section className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Featured Games</h2>
          <Button href="/games" variant="outline" size="sm">
            View All
          </Button>
        </div>

        {loading && <LoadingSpinner text="Loading games..." />}

        {error && (
          <div className={styles.error}>
            <p>Error loading games: {error.message}</p>
            <Button onClick={() => window.location.reload()} variant="secondary">
              Try Again
            </Button>
          </div>
        )}

        {data?.games?.edges && data.games.edges.length > 0 && (
          <div className={styles.gamesGrid}>
            {data.games.edges.map(({ node: game }: { node: GameNode }) => (
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
        )}

        {data?.games?.totalCount === 0 && (
          <EmptyState
            icon="🎮"
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
