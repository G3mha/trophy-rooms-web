"use client";

import Link from "next/link";
import { Medal } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import styles from "./LeaderboardEntry.module.css";

interface LeaderboardEntryProps {
  rank: number;
  userId: string;
  userName: string | null;
  userEmail: string;
  value: number;
  valueLabel: string;
  secondaryValue?: number;
  secondaryLabel?: string;
  highlight?: boolean;
}

function getRankDisplay(rank: number): { icon: React.ReactNode; className: string } {
  switch (rank) {
    case 1:
      return { icon: <Medal size={20} color="#FFD700" />, className: styles.rankGold };
    case 2:
      return { icon: <Medal size={20} color="#C0C0C0" />, className: styles.rankSilver };
    case 3:
      return { icon: <Medal size={20} color="#CD7F32" />, className: styles.rankBronze };
    default:
      return { icon: `#${rank}`, className: styles.rankDefault };
  }
}

export function LeaderboardEntry({
  rank,
  userId,
  userName,
  userEmail,
  value,
  valueLabel,
  secondaryValue,
  secondaryLabel,
  highlight = false,
}: LeaderboardEntryProps) {
  const initials = getInitials(userName, userEmail);
  const avatarColor = getAvatarColor(userName, userEmail);
  const displayName = userName || userEmail.split("@")[0];
  const rankInfo = getRankDisplay(rank);

  return (
    <div className={`${styles.entry} ${highlight ? styles.highlight : ""}`}>
      <div className={`${styles.rank} ${rankInfo.className}`}>
        {rank <= 3 ? (
          <span className={styles.rankIcon}>{rankInfo.icon}</span>
        ) : (
          <span className={styles.rankNumber}>{rank}</span>
        )}
      </div>

      <Link href={`/users/${userId}`} className={styles.userLink}>
        <div
          className={styles.avatar}
          style={{ backgroundColor: avatarColor }}
        >
          <span>{initials}</span>
        </div>
        <span className={styles.userName}>{displayName}</span>
      </Link>

      <div className={styles.stats}>
        <div className={styles.primaryStat}>
          <span className={styles.statValue}>{value.toLocaleString()}</span>
          <span className={styles.statLabel}>{valueLabel}</span>
        </div>
        {secondaryValue !== undefined && secondaryLabel && (
          <div className={styles.secondaryStat}>
            <span className={styles.statValue}>{secondaryValue.toLocaleString()}</span>
            <span className={styles.statLabel}>{secondaryLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized entry for fastest completions
interface FastestCompletionEntryProps {
  rank: number;
  userId: string;
  userName: string | null;
  userEmail: string;
  gameId: string;
  gameTitle: string;
  completionTimeHours: number;
  completedAt: string;
  highlight?: boolean;
}

function formatCompletionTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (remainingHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remainingHours}h`;
}

export function FastestCompletionEntry({
  rank,
  userId,
  userName,
  userEmail,
  gameId,
  gameTitle,
  completionTimeHours,
  completedAt,
  highlight = false,
}: FastestCompletionEntryProps) {
  const initials = getInitials(userName, userEmail);
  const avatarColor = getAvatarColor(userName, userEmail);
  const displayName = userName || userEmail.split("@")[0];
  const rankInfo = getRankDisplay(rank);

  return (
    <div className={`${styles.entry} ${highlight ? styles.highlight : ""}`}>
      <div className={`${styles.rank} ${rankInfo.className}`}>
        {rank <= 3 ? (
          <span className={styles.rankIcon}>{rankInfo.icon}</span>
        ) : (
          <span className={styles.rankNumber}>{rank}</span>
        )}
      </div>

      <Link href={`/users/${userId}`} className={styles.userLink}>
        <div
          className={styles.avatar}
          style={{ backgroundColor: avatarColor }}
        >
          <span>{initials}</span>
        </div>
        <span className={styles.userName}>{displayName}</span>
      </Link>

      <div className={styles.gameInfo}>
        <Link href={`/games/${gameId}`} className={styles.gameLink}>
          {gameTitle}
        </Link>
        <span className={styles.completedDate}>
          {new Date(completedAt).toLocaleDateString()}
        </span>
      </div>

      <div className={styles.completionTime}>
        <span className={styles.timeValue}>{formatCompletionTime(completionTimeHours)}</span>
        <span className={styles.timeLabel}>completion time</span>
      </div>
    </div>
  );
}
