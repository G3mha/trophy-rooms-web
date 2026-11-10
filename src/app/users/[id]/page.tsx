"use client";

import { use } from "react";
import { useQuery } from "@apollo/client";
import {
  Trophy,
  Gamepad2,
  PartyPopper,
  User,
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
} from "@/components";
import styles from "./page.module.css";

interface GameProgressData {
  gameId: string;
  gameTitle: string;
  gameCoverUrl: string | null;
  earnedCount: number;
  totalCount: number;
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
      <ProfileHeader
        name={user.name}
        userId={id}
        memberSince={user.createdAt || new Date().toISOString()}
        achievementCount={user.achievementCount || 0}
        trophyCount={trophyCount}
        gamesPlayed={gameProgress.length}
        stats={user.stats}
      />

      {user.recentAchievements && user.recentAchievements.length > 0 && (
        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <span className={styles.sectionCount}>
              {user.recentAchievements.length} recent
            </span>
          </div>
          <RecentActivity achievements={user.recentAchievements} />
        </section>
      )}

      {completedGames.length > 0 && (
        <section className={styles.trophyShowcase}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Trophy className={styles.crimsonIcon} size={24} /> Platinum Trophies
            </h2>
            <span className={styles.sectionCount}>{completedGames.length} {completedGames.length === 1 ? "game" : "games"}</span>
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
          <h2 className={styles.sectionTitle}>Games In Progress</h2>
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
