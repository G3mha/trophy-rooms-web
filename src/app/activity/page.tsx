"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { useUser } from "@clerk/nextjs";
import {
  Gamepad2,
  Trophy,
  Inbox,
  Lightbulb,
  Radar,
  Flame,
  Users,
} from "lucide-react";
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
  const highlightedCount = currentUserId
    ? activityData.filter((entry) => entry.userId === currentUserId).length
    : 0;
  const trophyCount = activityData.filter((entry) => entry.type === "trophy").length;
  const uniquePlayers = new Set(activityData.map((entry) => entry.userId)).size;

  return (
    <div className={styles.container}>
      <header className={styles.hero}>
        <div className={styles.heroLead}>
          <div className={styles.eyebrow}>
            <Radar size={16} />
            <span>Live Community Pulse</span>
          </div>
          <h1 className={styles.title}>Activity Feed</h1>
          <p className={styles.subtitle}>
            See what the community is achieving right now, with your own unlocks
            called out in the stream.
          </p>
        </div>

        <div className={styles.filters}>
          <button
            onClick={() => setFilter("all")}
            className={`${styles.filterBtn} ${filter === "all" ? styles.filterActive : ""}`}
          >
            <Gamepad2 className={styles.filterIcon} size={16} />
            All Activity
          </button>
          <button
            onClick={() => setFilter("trophies")}
            className={`${styles.filterBtn} ${filter === "trophies" ? styles.filterActive : ""}`}
          >
            <Trophy className={styles.filterIcon} size={16} />
            Trophies Only
          </button>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <Users size={16} />
            <span>{uniquePlayers} active players</span>
          </div>
          <div className={styles.heroStat}>
            <Trophy size={16} />
            <span>{trophyCount} trophy moments</span>
          </div>
          <div className={styles.heroStat}>
            <Flame size={16} />
            <span>{highlightedCount} highlighted for you</span>
          </div>
        </div>
      </header>

      <section className={styles.feedSection}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <LoadingSpinner text="Loading activity..." />
          </div>
        ) : activityData.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox className={styles.emptyIcon} size={48} />
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

      <div className={styles.infoBanner}>
        <Lightbulb className={styles.infoIcon} size={18} />
        <p>
          Activity shows the latest achievements and trophies earned by the community.
          Your own activity is highlighted!
        </p>
      </div>
    </div>
  );
}
