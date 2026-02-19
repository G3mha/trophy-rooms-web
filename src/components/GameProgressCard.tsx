"use client";

import Link from "next/link";
import styles from "./GameProgressCard.module.css";

interface GameProgressCardProps {
  gameId: string;
  gameTitle: string;
  gameCoverUrl?: string | null;
  earnedCount: number;
  totalCount: number;
  earnedPoints: number;
  totalPoints: number;
  percentComplete: number;
  hasTrophy: boolean;
  trophyEarnedAt?: string | null;
  compact?: boolean;
}

export function GameProgressCard({
  gameId,
  gameTitle,
  gameCoverUrl,
  earnedCount,
  totalCount,
  earnedPoints,
  totalPoints,
  percentComplete,
  hasTrophy,
  trophyEarnedAt,
  compact = false,
}: GameProgressCardProps) {
  const isComplete = percentComplete === 100;

  return (
    <Link
      href={`/games/${gameId}`}
      className={`${styles.card} ${isComplete ? styles.cardComplete : ""} ${compact ? styles.cardCompact : ""}`}
    >
      {/* Cover Image */}
      <div className={styles.coverContainer}>
        {gameCoverUrl ? (
          <img src={gameCoverUrl} alt={gameTitle} className={styles.cover} />
        ) : (
          <div className={styles.coverPlaceholder}>
            <span>🎮</span>
          </div>
        )}
        {hasTrophy && (
          <div className={styles.trophyOverlay}>
            <span className={styles.trophyIcon}>🏆</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{gameTitle}</h3>
          {hasTrophy && (
            <span className={styles.trophyBadge}>Crimson Trophy</span>
          )}
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${isComplete ? styles.progressComplete : ""}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <span className={styles.progressText}>{percentComplete}%</span>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {earnedCount}/{totalCount}
            </span>
            <span className={styles.statLabel}>Achievements</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {earnedPoints.toLocaleString()}
            </span>
            <span className={styles.statLabel}>Points</span>
          </div>
        </div>

        {/* Trophy Date */}
        {hasTrophy && trophyEarnedAt && (
          <div className={styles.trophyDate}>
            Completed {new Date(trophyEarnedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </Link>
  );
}
