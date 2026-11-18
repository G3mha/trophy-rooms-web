"use client";

import { useQuery } from "@apollo/client";
import { toast } from "sonner";
import { useAuth, RedirectToSignIn } from "@/lib/auth";
import {
  Trophy,
  Gamepad2,
  PartyPopper,
} from "lucide-react";
import {
  GET_ME,
  GET_MY_TROPHIES,
  GET_MY_GAME_PROGRESS,
  GET_MY_PROFILE,
} from "@/graphql/queries";
import {
  PageSkeleton,
  EmptyState,
  Button,
  ProfileHeader,
  ProfileShowcases,
  GameProgressCard,
} from "@/components";
import styles from "./page.module.css";

interface GameProgressData {
  gameFamilyId: string;
  gameTitle: string;
  gameCoverUrl: string | null;
  earnedCount: number;
  totalCount: number;
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

  const { data: profileData, loading: profileLoading } = useQuery(GET_MY_PROFILE, {
    skip: !isSignedIn,
  });

  if (!isLoaded) {
    return <div className={styles.container}><PageSkeleton variant="rows" label="Loading your trophy room" /></div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  const loading = userLoading || trophiesLoading || progressLoading || profileLoading;
  const profile = profileData?.me;
  const user = userData?.me;
  const trophyCount = trophiesData?.myTrophies?.totalCount || 0;
  const gameProgress: GameProgressData[] = progressData?.myGameProgress || [];

  const completedGames = gameProgress.filter((g) => g.hasTrophy);
  const inProgressGames = gameProgress.filter((g) => !g.hasTrophy);

  if (loading) {
    return (
      <div className={styles.container}>
        <PageSkeleton variant="rows" label="Loading your trophy room" />
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
      <ProfileHeader
        name={user?.name}
        userId={user?.id || ""}
        memberSince={user?.createdAt || new Date().toISOString()}
        achievementCount={user?.achievementCount || 0}
        trophyCount={trophyCount}
        gamesPlayed={gameProgress.length}
        stats={user?.stats}
        isOwnProfile={true}
        onShare={handleShare}
        avatarUrl={profile?.avatarUrl}
        bio={profile?.bio}
        socialLinks={profile?.socialLinks}
      />

      {profile && <ProfileShowcases profile={profile} />}

      {completedGames.length > 0 && (
        <section className={styles.trophyShowcase}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Trophy className={styles.crimsonIcon} size={24} /> Platinums
            </h2>
            <span className={styles.sectionCount}>{completedGames.length} {completedGames.length === 1 ? "game" : "games"}</span>
          </div>
          <p className={styles.sectionSubtitle}>100% completion achieved in these games</p>
          <div className={styles.progressGrid}>
            {completedGames.map((game) => (
              <GameProgressCard
                key={game.gameFamilyId}
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
        <p className={styles.sectionSubtitle}>
          Keep earning trophies to unlock Platinums
        </p>

        {inProgressGames.length > 0 ? (
          <div className={styles.progressGrid}>
            {inProgressGames.map((game) => (
              <GameProgressCard
                key={game.gameFamilyId}
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
            title="No trophies yet"
            description="Start playing games and marking your trophies to fill your trophy room!"
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
