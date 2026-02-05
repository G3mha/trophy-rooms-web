"use client";

import { useQuery } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { GET_ME, GET_MY_ACHIEVEMENTS, GET_MY_TROPHIES } from "@/graphql/queries";
import {
  StatCard,
  AchievementCard,
  LoadingSpinner,
  EmptyState,
  Button,
} from "@/components";
import styles from "./page.module.css";

interface UserAchievementNode {
  id: string;
  createdAt: string;
  achievement: {
    id: string;
    title: string;
    description?: string | null;
    iconUrl?: string | null;
    achievementSet: {
      id: string;
      title: string;
      game: {
        id: string;
        title: string;
      };
    };
  };
}

interface TrophyNode {
  id: string;
  createdAt: string;
  game: {
    id: string;
    title: string;
    coverUrl?: string | null;
  };
}

export default function Dashboard() {
  const { isSignedIn, isLoaded } = useAuth();

  const { data: userData, loading: userLoading } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });

  const { data: achievementsData, loading: achievementsLoading } = useQuery(
    GET_MY_ACHIEVEMENTS,
    {
      variables: { first: 5 },
      skip: !isSignedIn,
    }
  );

  const { data: trophiesData, loading: trophiesLoading } = useQuery(
    GET_MY_TROPHIES,
    {
      variables: { first: 5 },
      skip: !isSignedIn,
    }
  );

  if (!isLoaded) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const loading = userLoading || achievementsLoading || trophiesLoading;
  const user = userData?.me;
  const achievements = achievementsData?.myAchievements?.edges || [];
  const trophies = trophiesData?.myTrophies?.edges || [];

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back, {user?.name || "Player"}!</h1>
        <p className={styles.subtitle}>Here&apos;s your gaming progress</p>
      </header>

      {/* Stats Grid */}
      <section className={styles.stats}>
        <StatCard
          icon="🏆"
          value={user?.trophyCount || 0}
          label="Trophies"
          variant="gold"
        />
        <StatCard
          icon="⭐"
          value={user?.achievementCount || 0}
          label="Achievements"
          variant="red"
        />
        <StatCard
          icon="🎮"
          value={user?.gamesWithAchievementsCount || 0}
          label="Games Completed"
          variant="blue"
        />
      </section>

      {/* Recent Activity */}
      <div className={styles.columns}>
        {/* Recent Achievements */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Achievements</h2>
          </div>

          {achievements.length > 0 ? (
            <div className={styles.achievementList}>
              {achievements.map(({ node }: { node: UserAchievementNode }) => (
                <AchievementCard
                  key={node.id}
                  id={node.achievement.id}
                  title={node.achievement.title}
                  description={node.achievement.description}
                  iconUrl={node.achievement.iconUrl}
                  gameName={node.achievement.achievementSet.game.title}
                  isCompleted={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="⭐"
              title="No achievements yet"
              description="Start playing games and mark your achievements!"
              action={<Button href="/games">Browse Games</Button>}
            />
          )}
        </section>

        {/* Trophies */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Trophies</h2>
          </div>

          {trophies.length > 0 ? (
            <div className={styles.trophyList}>
              {trophies.map(({ node }: { node: TrophyNode }) => (
                <div key={node.id} className={styles.trophyCard}>
                  <div className={styles.trophyIcon}>🏆</div>
                  <div className={styles.trophyInfo}>
                    <h4 className={styles.trophyGame}>{node.game.title}</h4>
                    <p className={styles.trophyDate}>
                      Earned {new Date(node.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🏆"
              title="No trophies yet"
              description="Complete all achievements in a game to earn a trophy!"
            />
          )}
        </section>
      </div>
    </div>
  );
}
