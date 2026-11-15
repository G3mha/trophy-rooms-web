"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@/lib/auth";
import {
  Trophy,
  Gamepad2,
  Zap,
  LucideIcon,
  Crown,
  Medal,
} from "lucide-react";
import {
  GET_LEADERBOARD_BY_TROPHIES,
  GET_LEADERBOARD_BY_ACHIEVEMENTS,
  GET_LEADERBOARD_BY_GAMES,
  GET_FASTEST_COMPLETIONS,
  GET_ME,
} from "@/graphql/queries";
import {
  PageSkeleton,
  LeaderboardEntry,
  FastestCompletionEntry,
} from "@/components";
import { getDisplayName } from "@/lib/avatar-utils";
import styles from "./page.module.css";

type LeaderboardTab =
  | "trophies"
  | "achievements"
  | "games"
  | "fastest";

interface LeaderboardEntryData {
  rank: number;
  userId: string;
  userName: string | null;
  value: number;
  secondaryValue?: number;
}

interface FastestCompletionData {
  rank: number;
  userId: string;
  userName: string | null;
  gameId: string;
  gameTitle: string;
  completionTimeHours: number;
  completedAt: string;
}

const TABS: {
  id: LeaderboardTab;
  label: string;
  Icon: LucideIcon;
  description: string;
}[] = [
  {
    id: "trophies",
    label: "Top Completionists",
    Icon: Trophy,
    description: "Most 100% game completions",
  },
  {
    id: "achievements",
    label: "Trophy Hunters",
    Icon: Trophy,
    description: "Most trophies earned",
  },
  {
    id: "games",
    label: "Game Explorers",
    Icon: Gamepad2,
    description: "Most unique games played",
  },
  {
    id: "fastest",
    label: "Speedrunners",
    Icon: Zap,
    description: "Fastest 100% completions",
  },
];

// Trophies show as a trophy icon; the word stays for screen readers
const ACHIEVEMENTS_LABEL = (
  <>
    <Trophy size={12} className="inline align-[-0.125em]" aria-hidden />
    <span className="sr-only">Trophies</span>
  </>
);

const VALUE_LABELS: Record<LeaderboardTab, ReactNode> = {
  trophies: "Platinums",
  achievements: ACHIEVEMENTS_LABEL,
  games: "Games",
  fastest: "",
};

const SECONDARY_LABELS: Record<LeaderboardTab, ReactNode> = {
  trophies: ACHIEVEMENTS_LABEL,
  achievements: "Platinums",
  games: "Platinums",
  fastest: "",
};

// "1 Platinum", not "1 Platinums". Icon labels pass through unchanged
function labelFor(label: ReactNode, count?: number): ReactNode {
  return count === 1 && typeof label === "string" ? label.replace(/s$/, "") : label;
}

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("trophies");
  const { isSignedIn } = useAuth();
  // Leaderboard entries carry the database user id, so match against me.id
  const { data: meData } = useQuery(GET_ME, { skip: !isSignedIn });

  const { data: trophiesData, loading: trophiesLoading } = useQuery(
    GET_LEADERBOARD_BY_TROPHIES,
    {
      variables: { limit: 25 },
      skip: activeTab !== "trophies",
    }
  );

  const { data: achievementsData, loading: achievementsLoading } = useQuery(
    GET_LEADERBOARD_BY_ACHIEVEMENTS,
    {
      variables: { limit: 25 },
      skip: activeTab !== "achievements",
    }
  );

  const { data: gamesData, loading: gamesLoading } = useQuery(
    GET_LEADERBOARD_BY_GAMES,
    {
      variables: { limit: 25 },
      skip: activeTab !== "games",
    }
  );

  const { data: fastestData, loading: fastestLoading } = useQuery(
    GET_FASTEST_COMPLETIONS,
    {
      variables: { limit: 25 },
      skip: activeTab !== "fastest",
    }
  );

  const getLeaderboardData = (): LeaderboardEntryData[] | FastestCompletionData[] | null => {
    switch (activeTab) {
      case "trophies":
        return trophiesData?.leaderboardByTrophies || null;
      case "achievements":
        return achievementsData?.leaderboardByAchievements || null;
      case "games":
        return gamesData?.leaderboardByGamesPlayed || null;
      case "fastest":
        return fastestData?.fastestCompletions || null;
      default:
        return null;
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case "trophies":
        return trophiesLoading;
      case "achievements":
        return achievementsLoading;
      case "games":
        return gamesLoading;
      case "fastest":
        return fastestLoading;
      default:
        return false;
    }
  };

  const currentTab = TABS.find((t) => t.id === activeTab)!;
  const leaderboardData = getLeaderboardData();
  const loading = isLoading();
  const podium = leaderboardData?.slice(0, 3) || [];
  const currentUserId = meData?.me?.id;

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroLead}>
          <h1 className={styles.title}>Leaderboards</h1>
        </div>
      </header>

      <nav className={styles.tabNav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
          >
            <tab.Icon className={styles.tabIcon} size={18} />
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.tabDescription}>
        <currentTab.Icon className={styles.descriptionIcon} size={18} />
        <span>{currentTab.description}</span>
      </div>

      {!loading && podium.length > 0 && (
        <section className={styles.podiumSection}>
          <div className={styles.podiumHeader}>
            <h2 className={styles.sectionTitle}>Current Podium</h2>
          </div>
          <div className={styles.podiumGrid}>
            {podium.map((entry, index) => (
              <div
                key={`${activeTab}-podium-${entry.userId}-${index}`}
                className={styles.podiumCard}
              >
                <div className={styles.podiumRankWrap}>
                  {index === 0 ? <Crown size={18} /> : <Medal size={18} />}
                  <span className={styles.podiumRank}>#{index + 1}</span>
                </div>
                <h3 className={styles.podiumName}>
                  {getDisplayName(entry.userName, entry.userId)}
                </h3>
                {"value" in entry && (
                  <p className={styles.podiumValue}>
                    {entry.value} {labelFor(VALUE_LABELS[activeTab], entry.value)}
                  </p>
                )}
                {"completionTimeHours" in entry && (
                  <p className={styles.podiumValue}>
                    {entry.completionTimeHours.toFixed(1)}h completion
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.leaderboardSection}>
        {loading ? (
          <PageSkeleton variant="rows" label="Loading leaderboard" header={false} count={10} />
        ) : !leaderboardData || leaderboardData.length === 0 ? (
          <div className={styles.emptyState}>
            <currentTab.Icon className={styles.emptyIcon} size={48} />
            <h3 className={styles.emptyTitle}>No entries yet</h3>
            <p className={styles.emptyText}>
              Be the first to climb this leaderboard!
            </p>
          </div>
        ) : activeTab === "fastest" ? (
          <div className={styles.leaderboardList}>
            {(leaderboardData as FastestCompletionData[]).map((entry) => (
              <FastestCompletionEntry
                key={`${entry.userId}-${entry.gameId}`}
                rank={entry.rank}
                userId={entry.userId}
                userName={entry.userName}
                gameId={entry.gameId}
                gameTitle={entry.gameTitle}
                completionTimeHours={entry.completionTimeHours}
                completedAt={entry.completedAt}
                highlight={entry.userId === currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className={styles.leaderboardList}>
            {(leaderboardData as LeaderboardEntryData[]).map((entry) => (
              <LeaderboardEntry
                key={entry.userId}
                rank={entry.rank}
                userId={entry.userId}
                userName={entry.userName}
                value={entry.value}
                valueLabel={labelFor(VALUE_LABELS[activeTab], entry.value)}
                secondaryValue={entry.secondaryValue}
                secondaryLabel={labelFor(SECONDARY_LABELS[activeTab], entry.secondaryValue)}
                highlight={entry.userId === currentUserId}
              />
            ))}
          </div>
        )}
      </section>

      {!isSignedIn && (
        <div className={styles.signInPrompt}>
          <p>Sign in to see your rank and compete with others!</p>
        </div>
      )}
    </div>
  );
}
