"use client";

import Link from "next/link";
import { Trophy, Medal } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
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

function getTierColor(tier?: AchievementTier): string {
  switch (tier) {
    case "GOLD":
      return "#FFD700";
    case "SILVER":
      return "#C0C0C0";
    case "BRONZE":
    default:
      return "#CD7F32";
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
            <Trophy className={styles.trophyIcon} size={16} />
            <Link href={`/games/${gameId}`} className={styles.gameLink}>
              {gameTitle}
            </Link>
            <span className={styles.trophyBadge}>100% Complete</span>
          </div>
        ) : (
          <div className={styles.achievementInfo}>
            <Medal className={styles.tierIcon} size={16} color={getTierColor(achievementTier)} />
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
