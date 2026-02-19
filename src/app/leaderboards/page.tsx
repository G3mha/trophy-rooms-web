"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  GET_LEADERBOARD_BY_TROPHIES,
  GET_LEADERBOARD_BY_ACHIEVEMENTS,
  GET_LEADERBOARD_BY_POINTS,
  GET_LEADERBOARD_BY_GAMES,
  GET_FASTEST_COMPLETIONS,
} from "@/graphql/queries";
import { LoadingSpinner, LeaderboardEntry, FastestCompletionEntry } from "@/components";
import styles from "./page.module.css";

type LeaderboardTab = "trophies" | "achievements" | "points" | "games" | "fastest";

interface LeaderboardEntryData {
  rank: number;
  userId: string;
  userName: string | null;
  userEmail: string;
  value: number;
  secondaryValue?: number;
}

interface FastestCompletionData {
  rank: number;
  userId: string;
  userName: string | null;
  userEmail: string;
  gameId: string;
  gameTitle: string;
  completionTimeHours: number;
  completedAt: string;
}

const TABS: { id: LeaderboardTab; label: string; icon: string; description: string }[] = [
  { id: "trophies", label: "Top Completionists", icon: "🏆", description: "Most 100% game completions" },
  { id: "achievements", label: "Achievement Hunters", icon: "⭐", description: "Most achievements earned" },
  { id: "points", label: "Point Leaders", icon: "💎", description: "Highest total achievement points" },
  { id: "games", label: "Game Explorers", icon: "🎮", description: "Most unique games played" },
  { id: "fastest", label: "Speedrunners", icon: "⚡", description: "Fastest 100% completions" },
];

const VALUE_LABELS: Record<LeaderboardTab, string> = {
  trophies: "Trophies",
  achievements: "Achievements",
  points: "Points",
  games: "Games",
  fastest: "",
};

const SECONDARY_LABELS: Record<LeaderboardTab, string> = {
  trophies: "Achievements",
  achievements: "Trophies",
  points: "Achievements",
  games: "Trophies",
  fastest: "",
};

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("trophies");
  const { isSignedIn } = useAuth();
  const { user } = useUser();

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

  const { data: pointsData, loading: pointsLoading } = useQuery(
    GET_LEADERBOARD_BY_POINTS,
    {
      variables: { limit: 25 },
      skip: activeTab !== "points",
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
      case "points":
        return pointsData?.leaderboardByPoints || null;
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
      case "points":
        return pointsLoading;
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

  // Get current user's Clerk ID to highlight their entry
  const currentUserId = user?.id;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Leaderboards</h1>
        <p className={styles.subtitle}>
          See how you stack up against other trophy hunters
        </p>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab Description */}
      <div className={styles.tabDescription}>
        <span className={styles.descriptionIcon}>{currentTab.icon}</span>
        <span>{currentTab.description}</span>
      </div>

      {/* Leaderboard Content */}
      <section className={styles.leaderboardSection}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner text="Loading leaderboard..." />
          </div>
        ) : !leaderboardData || leaderboardData.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>{currentTab.icon}</span>
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
                userEmail={entry.userEmail}
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
                userEmail={entry.userEmail}
                value={entry.value}
                valueLabel={VALUE_LABELS[activeTab]}
                secondaryValue={entry.secondaryValue}
                secondaryLabel={SECONDARY_LABELS[activeTab]}
                highlight={entry.userId === currentUserId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sign in prompt for non-authenticated users */}
      {!isSignedIn && (
        <div className={styles.signInPrompt}>
          <p>Sign in to see your rank and compete with others!</p>
        </div>
      )}
    </div>
  );
}
