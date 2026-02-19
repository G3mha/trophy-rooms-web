"use client";

import { useQuery } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { GET_ME, GET_MY_TROPHIES, GET_MY_GAME_PROGRESS } from "@/graphql/queries";
import { LoadingSpinner, EmptyState, Button, ProfileHeader, GameProgressCard } from "@/components";
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

export default function TrophyRoom() {
  const { isSignedIn, isLoaded } = useAuth();

  const { data: userData, loading: userLoading } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });

  const { data: trophiesData, loading: trophiesLoading } = useQuery(
    GET_MY_TROPHIES,
    {
      variables: { first: 100 },
      skip: !isSignedIn,
    }
  );

  const { data: progressData, loading: progressLoading } = useQuery(
    GET_MY_GAME_PROGRESS,
    {
      skip: !isSignedIn,
    }
  );

  if (!isLoaded) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const loading = userLoading || trophiesLoading || progressLoading;
  const user = userData?.me;
  const trophyCount = trophiesData?.myTrophies?.totalCount || 0;
  const gameProgress: GameProgressData[] = progressData?.myGameProgress || [];

  // Separate completed and in-progress games
  const completedGames = gameProgress.filter((g) => g.hasTrophy);
  const inProgressGames = gameProgress.filter((g) => !g.hasTrophy);

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading your trophy room..." />
      </div>
    );
  }

  const handleShare = () => {
    const url = `${window.location.origin}/users/${user?.id}`;
    navigator.clipboard.writeText(url);
    alert("Profile link copied to clipboard!");
  };

  return (
    <div className={styles.container}>
      {/* Profile Header */}
      <ProfileHeader
        name={user?.name}
        email={user?.email || ""}
        memberSince={user?.createdAt || new Date().toISOString()}
        achievementCount={user?.achievementCount || 0}
        trophyCount={trophyCount}
        gamesPlayed={gameProgress.length}
        stats={user?.stats}
        isOwnProfile={true}
        onShare={handleShare}
      />

      {/* Completed Games - Crimson Trophy Holders */}
      {completedGames.length > 0 && (
        <section className={styles.trophyShowcase}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.crimsonIcon}>🏆</span> Crimson Trophy Collection
          </h2>
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

      {/* Games In Progress */}
      <section className={styles.gamesSection}>
        <h2 className={styles.sectionTitle}>Games In Progress</h2>
        <p className={styles.sectionSubtitle}>
          Keep earning achievements to unlock Crimson Trophies
        </p>

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
            icon="🎮"
            title="No achievements yet"
            description="Start playing games and marking your achievements to fill your trophy room!"
            action={<Button href="/games">Browse Games</Button>}
          />
        ) : (
          <div className={styles.allComplete}>
            <span className={styles.allCompleteIcon}>🎉</span>
            <p>You've completed all your games! Browse for more challenges.</p>
            <Button href="/games">Browse Games</Button>
          </div>
        )}
      </section>
    </div>
  );
}
