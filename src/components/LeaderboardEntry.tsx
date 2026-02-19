"use client";

import Link from "next/link";
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

function getRankDisplay(rank: number): { icon: string; className: string } {
  switch (rank) {
    case 1:
      return { icon: "🥇", className: styles.rankGold };
    case 2:
      return { icon: "🥈", className: styles.rankSilver };
    case 3:
      return { icon: "🥉", className: styles.rankBronze };
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
