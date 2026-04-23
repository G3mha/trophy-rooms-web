"use client";

import { useQuery } from "@apollo/client";
import { toast } from "sonner";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import {
  Trophy,
  Gamepad2,
  PartyPopper,
  Sparkles,
  Target,
  TimerReset,
} from "lucide-react";
import {
  GET_ME,
  GET_MY_TROPHIES,
  GET_MY_GAME_PROGRESS,
} from "@/graphql/queries";
import {
  LoadingSpinner,
  EmptyState,
  Button,
  ProfileHeader,
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

  const completedGames = gameProgress.filter((g) => g.hasTrophy);
  const inProgressGames = gameProgress.filter((g) => !g.hasTrophy);
  const totalPoints = gameProgress.reduce((sum, game) => sum + game.earnedPoints, 0);
  const averageCompletion = gameProgress.length
    ? Math.round(
        gameProgress.reduce((sum, game) => sum + game.percentComplete, 0) /
          gameProgress.length
      )
    : 0;

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
    toast.success("Profile link copied to clipboard!");
  };

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
            <span>Your Personal Showcase</span>
          </>
        }
        title="Trophy Room"
        description="A live view of completed runs, active hunts, and the progress pushing you toward the next Platinum Trophy."
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

      <SummaryStats
        items={[
          {
            label: "Platinum Shelf",
            value: completedGames.length,
            text: "Games fully completed and preserved in your showcase.",
          },
          {
            label: "In Rotation",
            value: inProgressGames.length,
            text: "Active progress cards still pushing toward 100%.",
          },
          {
            label: "Momentum",
            value: `${averageCompletion}%`,
            text: "Average completion across your tracked library right now.",
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
          <p className={styles.sectionSubtitle}>100% completion achieved in these games</p>
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
        <p className={styles.sectionSubtitle}>
          Keep earning achievements to unlock Platinum Trophies
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
            icon={<Gamepad2 size={48} />}
            title="No achievements yet"
            description="Start playing games and marking your achievements to fill your trophy room!"
            action={<Button href="/games">Browse Games</Button>}
          />
        ) : (
          <div className={styles.allComplete}>
            <PartyPopper className={styles.allCompleteIcon} size={32} />
            <p>You&apos;ve completed all your games! Browse for more challenges.</p>
            <Button href="/games">Browse Games</Button>
          </div>
        )}
      </section>
    </div>
  );
}
