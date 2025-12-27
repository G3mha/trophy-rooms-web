"use client";

import styles from "./AchievementCard.module.css";

interface AchievementCardProps {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  isCompleted?: boolean;
  userCount?: number;
  gameName?: string;
  onToggle?: (id: string) => void;
  loading?: boolean;
}

export function AchievementCard({
  id,
  title,
  description,
  iconUrl,
  isCompleted = false,
  userCount = 0,
  gameName,
  onToggle,
  loading = false,
}: AchievementCardProps) {
  return (
    <div className={`${styles.card} ${isCompleted ? styles.completed : ""}`}>
      <div className={`${styles.icon} ${isCompleted ? styles.iconCompleted : ""}`}>
        {iconUrl ? (
          <img src={iconUrl} alt={title} className={styles.iconImage} />
        ) : (
          <span>{isCompleted ? "🏆" : "⭐"}</span>
        )}
      </div>
      <div className={styles.info}>
        <h4 className={styles.title}>{title}</h4>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
        <div className={styles.meta}>
          {gameName && <span className={styles.game}>{gameName}</span>}
          {userCount > 0 && (
            <span className={styles.userCount}>
              {userCount} {userCount === 1 ? "player" : "players"}
            </span>
          )}
        </div>
      </div>
      {onToggle && (
        <button
          className={`${styles.toggleBtn} ${isCompleted ? styles.toggleBtnCompleted : ""}`}
          onClick={() => onToggle(id)}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : isCompleted ? (
            "✓"
          ) : (
            "○"
          )}
        </button>
      )}
    </div>
  );
}
