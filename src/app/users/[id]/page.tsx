"use client";

import { use } from "react";
import { useQuery } from "@apollo/client";
import {
  Trophy,
  Gamepad2,
  PartyPopper,
  User,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import {
  GET_USER,
  GET_USER_TROPHIES,
  GET_USER_GAME_PROGRESS,
} from "@/graphql/queries";
import {
  LoadingSpinner,
  EmptyState,
  Button,
  ProfileHeader,
  RecentActivity,
  GameProgressCard,
  CatalogHero,
  SummaryStats,
} from "@/components";
import styles from "./page.module.css";

interface GameProgressData {
  gameId: string;
  gameTitle: string;
  gameCoverUrl: string | null;
  earnedCount: number;
  totalCount: number;
  earnedPoints: number;
  totalPoints: number;
  percentComplete: number;
  hasTrophy: boolean;
  trophyEarnedAt: string | null;
  lastActivityAt: string | null;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: userData, loading: userLoading, error: userError } = useQuery(
    GET_USER,
    {
      variables: { id },
    }
  );

  const { data: trophiesData, loading: trophiesLoading } = useQuery(
    GET_USER_TROPHIES,
    {
      variables: { userId: id, first: 100 },
    }
  );

  const { data: progressData, loading: progressLoading } = useQuery(
    GET_USER_GAME_PROGRESS,
    {
      variables: { userId: id },
    }
  );

  const loading = userLoading || trophiesLoading || progressLoading;
  const user = userData?.user;
  const trophyCount = trophiesData?.userTrophies?.totalCount || 0;
  const gameProgress: GameProgressData[] = progressData?.userGameProgress || [];
  const completedGames = gameProgress.filter((g) => g.hasTrophy);
  const inProgressGames = gameProgress.filter((g) => !g.hasTrophy);
  const totalPoints = gameProgress.reduce((sum, game) => sum + game.earnedPoints, 0);
  const averageCompletion = gameProgress.length
    ? Math.round(
        gameProgress.reduce((sum, game) => sum + game.percentComplete, 0) /
          gameProgress.length
      )
    : 0;
  const displayName = user?.name || user?.email?.split("@")[0] || "Player";

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className={styles.container}>
        <EmptyState
          icon={<User size={48} />}
          title="User not found"
          description="This user doesn't exist or their profile is not available."
          action={<Button href="/games">Browse Games</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <CatalogHero
        classes={{
          root: styles.hero,
          lead: styles.heroLead,
          eyebrow: styles.eyebrow,
          title: styles.heroTitle,
          description: styles.heroSubtitle,
          stats: styles.heroStats,
          stat: styles.heroStat,
        }}
        eyebrow={
          <>
            <Sparkles size={16} />
            <span>Public Profile</span>
          </>
        }
        title={`${displayName}'s Trophy Room`}
        description="Follow completed runs, active hunts, and the momentum behind this player's next Platinum Trophy."
        stats={[
          {
            icon: <Trophy size={16} />,
            label: `${completedGames.length} completed runs`,
          },
          {
            icon: <Target size={16} />,
            label: `${totalPoints.toLocaleString()} points earned`,
          },
          {
            icon: <TimerReset size={16} />,
            label: `${averageCompletion}% avg progress`,
          },
        ]}
      />

      <ProfileHeader
        name={user.name}
        email={user.email}
        memberSince={user.createdAt || new Date().toISOString()}
        achievementCount={user.achievementCount || 0}
        trophyCount={trophyCount}
        gamesPlayed={gameProgress.length}
        stats={user.stats}
      />

      {user.recentAchievements && user.recentAchievements.length > 0 && (
        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Latest Unlocks</p>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
            </div>
            <span className={styles.sectionCount}>
              {user.recentAchievements.length} recent
            </span>
          </div>
          <RecentActivity achievements={user.recentAchievements} />
        </section>
      )}

      <SummaryStats
        items={[
          {
            label: "Platinum Shelf",
            value: completedGames.length,
            text: "Games this player has fully completed and locked into their showcase.",
          },
          {
            label: "In Rotation",
            value: inProgressGames.length,
            text: "Active progress cards still moving toward 100%.",
          },
          {
            label: "Momentum",
            value: `${averageCompletion}%`,
            text: "Average completion across the tracked library right now.",
          },
        ]}
        className={styles.summaryGrid}
      />

      {completedGames.length > 0 && (
        <section className={styles.trophyShowcase}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Completed</p>
              <h2 className={styles.sectionTitle}>
                <Trophy className={styles.crimsonIcon} size={24} /> Platinum Trophy Collection
              </h2>
            </div>
            <span className={styles.sectionCount}>{completedGames.length} games</span>
          </div>
          <p className={styles.sectionSubtitle}>
            100% completion achieved in these games
          </p>
          <div className={styles.progressGrid}>
            {completedGames.map((game) => (
              <GameProgressCard
                key={game.gameId}
                gameId={game.gameId}
                gameTitle={game.gameTitle}
                gameCoverUrl={game.gameCoverUrl}
                earnedCount={game.earnedCount}
                totalCount={game.totalCount}
                earnedPoints={game.earnedPoints}
                totalPoints={game.totalPoints}
                percentComplete={game.percentComplete}
                hasTrophy={game.hasTrophy}
                trophyEarnedAt={game.trophyEarnedAt}
              />
            ))}
          </div>
        </section>
      )}

      <section className={styles.gamesSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Active Hunts</p>
            <h2 className={styles.sectionTitle}>Games In Progress</h2>
          </div>
          <span className={styles.sectionCount}>{inProgressGames.length} active</span>
        </div>
        <p className={styles.sectionSubtitle}>Working towards more Platinum Trophies</p>

        {inProgressGames.length > 0 ? (
          <div className={styles.progressGrid}>
            {inProgressGames.map((game) => (
              <GameProgressCard
                key={game.gameId}
                gameId={game.gameId}
                gameTitle={game.gameTitle}
                gameCoverUrl={game.gameCoverUrl}
                earnedCount={game.earnedCount}
                totalCount={game.totalCount}
                earnedPoints={game.earnedPoints}
                totalPoints={game.totalPoints}
                percentComplete={game.percentComplete}
                hasTrophy={game.hasTrophy}
                trophyEarnedAt={game.trophyEarnedAt}
              />
            ))}
          </div>
        ) : gameProgress.length === 0 ? (
          <EmptyState
            icon={<Gamepad2 size={48} />}
            title="No achievements yet"
            description="This user hasn't earned any achievements yet."
          />
        ) : (
          <div className={styles.allComplete}>
            <PartyPopper className={styles.allCompleteIcon} size={32} />
            <p>This user has completed all their tracked games.</p>
          </div>
        )}
      </section>
    </div>
  );
}
