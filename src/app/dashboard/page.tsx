"use client";

import { useQuery } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import {
  Trophy,
  Star,
  Gamepad2,
  Sparkles,
  ArrowRight,
  Clock3,
} from "lucide-react";
import {
  GET_ME,
  GET_MY_ACHIEVEMENTS,
  GET_MY_TROPHIES,
} from "@/graphql/queries";
import {
  AppImage,
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
  const firstName = user?.name?.split(" ")[0] || "Player";
  const latestAchievement = achievements[0]?.node;
  const latestTrophy = trophies[0]?.node;
  const gamesTracked = user?.gamesWithAchievementsCount || 0;
  const achievementCount = user?.achievementCount || 0;
  const trophyCount = user?.trophyCount || 0;

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroLead}>
          <div className={styles.eyebrow}>
            <Sparkles size={16} />
            <span>Personal Dashboard</span>
          </div>
          <h1 className={styles.title}>Welcome back, {firstName}.</h1>
          <p className={styles.subtitle}>
            Track your momentum, revisit recent unlocks, and keep your next
            Crimson Trophy in sight.
          </p>
          <div className={styles.heroActions}>
            <Button href="/trophy-room">Open Trophy Room</Button>
            <Button href="/activity" variant="outline">
              Community Activity
            </Button>
          </div>
        </div>

        <aside className={styles.heroPanel}>
          <div className={styles.heroPanelHeader}>
            <span className={styles.heroPanelLabel}>Latest Milestone</span>
            <Clock3 size={16} />
          </div>
          {latestTrophy ? (
            <div className={styles.milestoneCard}>
              <span className={styles.milestoneBadge}>New Trophy</span>
              <h2 className={styles.milestoneTitle}>{latestTrophy.node.game.title}</h2>
              <p className={styles.milestoneText}>
                Earned {new Date(latestTrophy.node.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : latestAchievement ? (
            <div className={styles.milestoneCard}>
              <span className={styles.milestoneBadge}>Fresh Unlock</span>
              <h2 className={styles.milestoneTitle}>
                {latestAchievement.node.achievement.title}
              </h2>
              <p className={styles.milestoneText}>
                From {latestAchievement.node.achievement.achievementSet.game.title}
              </p>
            </div>
          ) : (
            <div className={styles.milestoneCard}>
              <span className={styles.milestoneBadge}>Getting Started</span>
              <h2 className={styles.milestoneTitle}>Your room is waiting</h2>
              <p className={styles.milestoneText}>
                Browse games and mark your first achievement to start building momentum.
              </p>
            </div>
          )}

          <div className={styles.heroMiniStats}>
            <div className={styles.heroMiniStat}>
              <span className={styles.heroMiniValue}>{achievementCount}</span>
              <span className={styles.heroMiniLabel}>Total unlocks</span>
            </div>
            <div className={styles.heroMiniStat}>
              <span className={styles.heroMiniValue}>{gamesTracked}</span>
              <span className={styles.heroMiniLabel}>Games tracked</span>
            </div>
          </div>
        </aside>
      </header>

      <section className={styles.stats}>
        <StatCard
          icon={<Trophy size={24} />}
          value={trophyCount}
          label="Trophies"
          variant="gold"
        />
        <StatCard
          icon={<Star size={24} />}
          value={achievementCount}
          label="Achievements"
          variant="red"
        />
        <StatCard
          icon={<Gamepad2 size={24} />}
          value={gamesTracked}
          label="Games Tracked"
          variant="blue"
        />
      </section>

      <div className={styles.columns}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Recent Unlocks</p>
              <h2 className={styles.sectionTitle}>Achievements</h2>
            </div>
            <Button href="/activity" variant="ghost" className={styles.sectionLink}>
              View feed <ArrowRight size={14} />
            </Button>
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
              icon={<Star size={48} />}
              title="No achievements yet"
              description="Start playing games and mark your achievements!"
              action={<Button href="/games">Browse Games</Button>}
            />
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Completion Shelf</p>
              <h2 className={styles.sectionTitle}>Your Trophies</h2>
            </div>
            <Button href="/trophy-room" variant="ghost" className={styles.sectionLink}>
              Open room <ArrowRight size={14} />
            </Button>
          </div>

          {trophies.length > 0 ? (
            <div className={styles.trophyList}>
              {trophies.map(({ node }: { node: TrophyNode }) => (
                <div key={node.id} className={styles.trophyCard}>
                  <div className={styles.trophyMedia}>
                    <AppImage
                      src={node.game.coverUrl}
                      alt={node.game.title}
                      className={styles.trophyCover}
                      fallback={
                        <div className={styles.trophyIcon}>
                          <Trophy size={24} />
                        </div>
                      }
                    />
                  </div>
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
              icon={<Trophy size={48} />}
              title="No trophies yet"
              description="Complete all achievements in a game to earn a trophy!"
            />
          )}
        </section>
      </div>
    </div>
  );
}
