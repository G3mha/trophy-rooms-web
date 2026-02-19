"use client";

import Link from "next/link";
import styles from "./RecentActivity.module.css";

type AchievementTier = "BRONZE" | "SILVER" | "GOLD";

interface RecentAchievement {
  id: string;
  createdAt: string;
  achievement: {
    id: string;
    title: string;
    tier?: AchievementTier;
    points?: number;
    achievementSet: {
      game: {
        id: string;
        title: string;
      };
    };
  };
}

interface RecentActivityProps {
  achievements: RecentAchievement[];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTierIcon(tier?: AchievementTier): string {
  switch (tier) {
    case "GOLD":
      return "🥇";
    case "SILVER":
      return "🥈";
    case "BRONZE":
    default:
      return "🥉";
  }
}

export function RecentActivity({ achievements }: RecentActivityProps) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Recent Activity</h3>
      <div className={styles.timeline}>
        {achievements.map((item, index) => (
          <div key={item.id} className={styles.timelineItem}>
            <div className={styles.timelineLine}>
              <div className={`${styles.timelineDot} ${styles[`dot${item.achievement.tier || "BRONZE"}`]}`}>
                <span>{getTierIcon(item.achievement.tier)}</span>
              </div>
              {index < achievements.length - 1 && <div className={styles.connector} />}
            </div>
            <div className={styles.content}>
              <div className={styles.achievementInfo}>
                <span className={styles.achievementTitle}>
                  {item.achievement.title}
                </span>
                {item.achievement.points && item.achievement.points > 0 && (
                  <span className={styles.points}>+{item.achievement.points} pts</span>
                )}
              </div>
              <Link
                href={`/games/${item.achievement.achievementSet.game.id}`}
                className={styles.gameLink}
              >
                {item.achievement.achievementSet.game.title}
              </Link>
              <span className={styles.time}>{formatTimeAgo(item.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
