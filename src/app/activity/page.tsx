"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useUser } from "@clerk/nextjs";
import {
  GET_ACTIVITY_FEED,
  GET_RECENT_TROPHY_ACTIVITY,
} from "@/graphql/queries";
import { LoadingSpinner, ActivityFeedEntry } from "@/components";
import styles from "./page.module.css";

type ActivityFilter = "all" | "trophies";

interface ActivityEntry {
  id: string;
  type: "achievement" | "trophy";
  userId: string;
  userName: string | null;
  userEmail: string;
  achievementId?: string;
  achievementTitle?: string;
  achievementTier?: "BRONZE" | "SILVER" | "GOLD";
  achievementPoints?: number;
  gameId: string;
  gameTitle: string;
  earnedAt: string;
}

interface TrophyEntry {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  gameId: string;
  gameTitle: string;
  earnedAt: string;
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const { user } = useUser();

  const { data: allData, loading: allLoading } = useQuery(GET_ACTIVITY_FEED, {
    variables: { limit: 50 },
    skip: filter !== "all",
  });

  const { data: trophyData, loading: trophyLoading } = useQuery(
    GET_RECENT_TROPHY_ACTIVITY,
    {
      variables: { limit: 30 },
      skip: filter !== "trophies",
    }
  );

  const loading = filter === "all" ? allLoading : trophyLoading;

  const getActivityData = (): ActivityEntry[] => {
    if (filter === "all") {
      return allData?.activityFeed || [];
    }
    // Convert trophy entries to activity format
    return (trophyData?.recentTrophyActivity || []).map((t: TrophyEntry) => ({
      id: `trophy-${t.id}`,
      type: "trophy" as const,
      userId: t.userId,
      userName: t.userName,
      userEmail: t.userEmail,
      gameId: t.gameId,
      gameTitle: t.gameTitle,
      earnedAt: t.earnedAt,
    }));
  };

  const activityData = getActivityData();
  const currentUserId = user?.id;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Activity Feed</h1>
          <p className={styles.subtitle}>
            See what the community is achieving
          </p>
        </div>

        {/* Filter Buttons */}
        <div className={styles.filters}>
          <button
            onClick={() => setFilter("all")}
            className={`${styles.filterBtn} ${filter === "all" ? styles.filterActive : ""}`}
          >
            <span className={styles.filterIcon}>🎮</span>
            All Activity
          </button>
          <button
            onClick={() => setFilter("trophies")}
            className={`${styles.filterBtn} ${filter === "trophies" ? styles.filterActive : ""}`}
          >
            <span className={styles.filterIcon}>🏆</span>
            Trophies Only
          </button>
        </div>
      </header>

      {/* Activity List */}
      <section className={styles.feedSection}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner text="Loading activity..." />
          </div>
        ) : activityData.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <h3 className={styles.emptyTitle}>No activity yet</h3>
            <p className={styles.emptyText}>
              Be the first to earn an achievement!
            </p>
          </div>
        ) : (
          <div className={styles.feedList}>
            {activityData.map((entry) => (
              <ActivityFeedEntry
                key={entry.id}
                id={entry.id}
                type={entry.type}
                userId={entry.userId}
                userName={entry.userName}
                userEmail={entry.userEmail}
                achievementId={entry.achievementId}
                achievementTitle={entry.achievementTitle}
                achievementTier={entry.achievementTier}
                achievementPoints={entry.achievementPoints}
                gameId={entry.gameId}
                gameTitle={entry.gameTitle}
                earnedAt={entry.earnedAt}
                highlight={entry.userId === currentUserId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Info Banner */}
      <div className={styles.infoBanner}>
        <span className={styles.infoIcon}>💡</span>
        <p>
          Activity shows the latest achievements and trophies earned by the community.
          Your own activity is highlighted!
        </p>
      </div>
    </div>
  );
}
