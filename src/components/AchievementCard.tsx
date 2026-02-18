"use client";

import styles from "./AchievementCard.module.css";

export type AchievementTier = "BRONZE" | "SILVER" | "GOLD";

interface AchievementCardProps {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  tier?: AchievementTier;
  isCompleted?: boolean;
  userCount?: number;
  gameName?: string;
  onToggle?: (id: string) => void;
  loading?: boolean;
}

const tierConfig: Record<AchievementTier, { label: string; cardClass: string; badgeClass: string }> = {
  BRONZE: { label: "Bronze", cardClass: styles.tierBronze, badgeClass: styles.badgeBronze },
  SILVER: { label: "Silver", cardClass: styles.tierSilver, badgeClass: styles.badgeSilver },
  GOLD: { label: "Gold", cardClass: styles.tierGold, badgeClass: styles.badgeGold },
};

export function AchievementCard({
  id,
  title,
  description,
  iconUrl,
  tier = "BRONZE",
  isCompleted = false,
  userCount = 0,
  gameName,
  onToggle,
  loading = false,
}: AchievementCardProps) {
  const tierInfo = tierConfig[tier];

  return (
    <div className={`${styles.card} ${tierInfo.cardClass} ${isCompleted ? styles.completed : ""}`}>
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
          <span className={`${styles.tierBadge} ${tierInfo.badgeClass}`}>
            {tierInfo.label}
          </span>
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
