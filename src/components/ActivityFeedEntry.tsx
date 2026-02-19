"use client";

import Link from "next/link";
import styles from "./ActivityFeedEntry.module.css";

type AchievementTier = "BRONZE" | "SILVER" | "GOLD";
type ActivityType = "achievement" | "trophy";

interface ActivityFeedEntryProps {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string | null;
  userEmail: string;
  achievementId?: string;
  achievementTitle?: string;
  achievementTier?: AchievementTier;
  achievementPoints?: number;
  gameId: string;
  gameTitle: string;
  earnedAt: string;
  highlight?: boolean;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string | null, email: string): string {
  const str = name || email;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#e60012",
    "#00a651",
    "#0066b3",
    "#f5a623",
    "#9b59b6",
    "#e91e63",
    "#00bcd4",
  ];
  return colors[Math.abs(hash) % colors.length];
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

export function ActivityFeedEntry({
  type,
  userId,
  userName,
  userEmail,
  achievementTitle,
  achievementTier,
  achievementPoints,
  gameId,
  gameTitle,
  earnedAt,
  highlight = false,
}: ActivityFeedEntryProps) {
  const initials = getInitials(userName, userEmail);
  const avatarColor = getAvatarColor(userName, userEmail);
  const displayName = userName || userEmail.split("@")[0];

  return (
    <div className={`${styles.entry} ${highlight ? styles.highlight : ""}`}>
      {/* User Avatar */}
      <Link href={`/users/${userId}`} className={styles.avatarLink}>
        <div className={styles.avatar} style={{ backgroundColor: avatarColor }}>
          <span>{initials}</span>
        </div>
      </Link>

      {/* Activity Content */}
      <div className={styles.content}>
        <div className={styles.mainLine}>
          <Link href={`/users/${userId}`} className={styles.userName}>
            {displayName}
          </Link>
          <span className={styles.action}>
            {type === "trophy" ? "earned the Crimson Trophy for" : "unlocked"}
          </span>
        </div>

        {type === "trophy" ? (
          <div className={styles.trophyInfo}>
            <span className={styles.trophyIcon}>🏆</span>
            <Link href={`/games/${gameId}`} className={styles.gameLink}>
              {gameTitle}
            </Link>
            <span className={styles.trophyBadge}>100% Complete</span>
          </div>
        ) : (
          <div className={styles.achievementInfo}>
            <span className={styles.tierIcon}>{getTierIcon(achievementTier as AchievementTier)}</span>
            <span className={styles.achievementTitle}>{achievementTitle}</span>
            {achievementPoints && achievementPoints > 0 && (
              <span className={styles.points}>+{achievementPoints} pts</span>
            )}
          </div>
        )}

        {type === "achievement" && (
          <Link href={`/games/${gameId}`} className={styles.gameName}>
            {gameTitle}
          </Link>
        )}
      </div>

      {/* Time */}
      <div className={styles.time}>{formatTimeAgo(earnedAt)}</div>
    </div>
  );
}
