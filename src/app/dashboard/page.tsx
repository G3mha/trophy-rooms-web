"use client";

import { useQuery } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@/lib/auth";
import {
  Trophy,
  Star,
  Gamepad2,
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
  PageSkeleton,
  Skeleton,
  EmptyState,
  Button,
} from "@/components";
import styles from "./page.module.css";

interface UserAchievementNode {
  id: string;
  createdAt: string;
  achievement?: {
    id: string;
    title: string;
    description?: string | null;
    iconUrl?: string | null;
    achievementSet: {
      id: string;
      title: string;
      gameFamily?: {
        id: string;
        title: string;
        slug: string;
      };
    };
  };
}

interface UserAchievementEdge {
  node?: UserAchievementNode | null;
}

type ValidUserAchievementEdge = {
  node: UserAchievementNode & {
    achievement: NonNullable<UserAchievementNode["achievement"]> & {
      achievementSet: {
        gameFamily: {
          id: string;
          title: string;
          slug: string;
        };
      };
    };
  };
};

interface TrophyNode {
  id: string;
  createdAt: string;
  game: {
    id: string;
    title: string;
    coverUrl?: string | null;
  };
}

// Loading placeholder built from the dashboard's own layout classes, so the
// hero, stats and list columns sit exactly where the real ones will
function DashboardSkeleton() {
  return (
    <div className={styles.container} role="status" aria-label="Loading your dashboard">
      <div className={styles.hero}>
        <div className={styles.heroLead}>
          <Skeleton className={styles.skeletonTitle} />
          <div className={styles.heroActions}>
            <Skeleton className={styles.skeletonButton} />
            <Skeleton className={styles.skeletonButton} />
          </div>
        </div>
        <div className={styles.heroPanel}>
          <Skeleton className={styles.skeletonLabel} />
          <Skeleton className={styles.skeletonMilestone} />
        </div>
      </div>
      <div className={styles.stats}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={styles.skeletonStat} />
        ))}
      </div>
      <div className={styles.columns}>
        {[0, 1].map((i) => (
          <div key={i} className={styles.section}>
            <Skeleton className={styles.skeletonLabel} />
            <PageSkeleton variant="rows" header={false} count={3} />
          </div>
        ))}
      </div>
    </div>
  );
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
    return <DashboardSkeleton />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const loading = userLoading || achievementsLoading || trophiesLoading;
  const user = userData?.me;
  const achievements: ValidUserAchievementEdge[] =
    achievementsData?.myAchievements?.edges?.filter(
      (
        edge: UserAchievementEdge | null | undefined
      ): edge is ValidUserAchievementEdge =>
        Boolean(edge?.node?.achievement?.achievementSet?.gameFamily)
    ) || [];
  const trophies = (trophiesData?.myTrophies?.edges || []).filter(
    (edge: { node?: TrophyNode | null } | null) => Boolean(edge?.node)
  );
  const firstName = user?.name?.split(" ")[0] || "Player";
  const latestAchievement = achievements[0]?.node;
  const latestTrophy = trophies[0]?.node;
  const gamesTracked = user?.gamesWithAchievementsCount || 0;
  const achievementCount = user?.achievementCount || 0;
  const trophyCount = user?.trophyCount || 0;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroLead}>
          <h1 className={styles.title}>Welcome back, {firstName}.</h1>
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
              <span className={styles.milestoneBadge}>New Platinum</span>
              <h2 className={styles.milestoneTitle}>{latestTrophy.game.title}</h2>
              <p className={styles.milestoneText}>
                Earned {new Date(latestTrophy.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : latestAchievement ? (
            <div className={styles.milestoneCard}>
              <span className={styles.milestoneBadge}>Fresh Unlock</span>
              <h2 className={styles.milestoneTitle}>
                {latestAchievement.achievement.title}
              </h2>
              <p className={styles.milestoneText}>
                From {latestAchievement.achievement.achievementSet.gameFamily.title}
              </p>
            </div>
          ) : (
            <div className={styles.milestoneCard}>
              <span className={styles.milestoneBadge}>Getting Started</span>
              <h2 className={styles.milestoneTitle}>Your room is waiting</h2>
              <p className={styles.milestoneText}>
                Browse games and mark your first trophy to start building momentum.
              </p>
            </div>
          )}
        </aside>
      </header>

      <section className={styles.stats}>
        <StatCard
          icon={<Trophy size={24} />}
          value={trophyCount}
          label="Platinums"
          variant="gold"
        />
        <StatCard
          icon={<Star size={24} />}
          value={achievementCount}
          label="Trophies"
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
            <h2 className={styles.sectionTitle}>Trophies</h2>
            <Button href="/activity" variant="ghost" className={styles.sectionLink}>
              View feed <ArrowRight size={14} />
            </Button>
          </div>

          {achievements.length > 0 ? (
            <div className={styles.achievementList}>
              {achievements.map(({ node }) => (
                <AchievementCard
                  key={node.id}
                  id={node.achievement.id}
                  title={node.achievement.title}
                  description={node.achievement.description}
                  iconUrl={node.achievement.iconUrl}
                  gameName={node.achievement.achievementSet.gameFamily.title}
                  isCompleted={true}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Star size={48} />}
              title="No trophies yet"
              description="Start playing games and mark your trophies!"
              action={<Button href="/games">Browse Games</Button>}
            />
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Platinums</h2>
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
              title="No Platinums yet"
              description="Earn every trophy in a game to get its Platinum!"
            />
          )}
        </section>
      </div>
    </div>
  );
}
