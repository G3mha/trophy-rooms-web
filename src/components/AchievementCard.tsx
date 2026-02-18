"use client";

import styles from "./AchievementCard.module.css";

export type AchievementTier = "BRONZE" | "SILVER" | "GOLD";

interface AchievementCardProps {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  points?: number;
  tier?: AchievementTier;
  isCompleted?: boolean;
  userCount?: number;
  totalPlayers?: number;
  gameName?: string;
  onToggle?: (id: string) => void;
  loading?: boolean;
}

const tierConfig: Record<AchievementTier, {
  label: string;
  cardClass: string;
  badgeClass: string;
  icon: string;
  iconClass: string;
}> = {
  BRONZE: {
    label: "Bronze",
    cardClass: styles.tierBronze,
    badgeClass: styles.badgeBronze,
    icon: "🥉",
    iconClass: styles.iconBronze,
  },
  SILVER: {
    label: "Silver",
    cardClass: styles.tierSilver,
    badgeClass: styles.badgeSilver,
    icon: "🥈",
    iconClass: styles.iconSilver,
  },
  GOLD: {
    label: "Gold",
    cardClass: styles.tierGold,
    badgeClass: styles.badgeGold,
    icon: "🥇",
    iconClass: styles.iconGold,
  },
};

function getRarityLabel(percentage: number): { label: string; className: string } {
  if (percentage <= 5) return { label: "Ultra Rare", className: styles.rarityUltraRare };
  if (percentage <= 15) return { label: "Very Rare", className: styles.rarityVeryRare };
  if (percentage <= 30) return { label: "Rare", className: styles.rarityRare };
  if (percentage <= 50) return { label: "Uncommon", className: styles.rarityUncommon };
  return { label: "Common", className: styles.rarityCommon };
}

export function AchievementCard({
  id,
  title,
  description,
  iconUrl,
  points = 0,
  tier = "BRONZE",
  isCompleted = false,
  userCount = 0,
  totalPlayers = 0,
  gameName,
  onToggle,
  loading = false,
}: AchievementCardProps) {
  const tierInfo = tierConfig[tier];

  // Calculate rarity percentage
  const rarityPercentage = totalPlayers > 0
    ? Math.round((userCount / totalPlayers) * 100 * 10) / 10
    : 0;
  const rarityInfo = getRarityLabel(rarityPercentage);

  return (
    <div className={`${styles.card} ${tierInfo.cardClass} ${isCompleted ? styles.completed : ""}`}>
      <div className={`${styles.icon} ${tierInfo.iconClass} ${isCompleted ? styles.iconCompleted : ""}`}>
        {iconUrl ? (
          <img src={iconUrl} alt={title} className={styles.iconImage} />
        ) : (
          <span className={styles.tierIcon}>{tierInfo.icon}</span>
        )}
        {!isCompleted && <div className={styles.iconShade} />}
      </div>
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <h4 className={styles.title}>{title}</h4>
          {points > 0 && (
            <span className={styles.points}>{points} pts</span>
          )}
        </div>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
        <div className={styles.meta}>
          <span className={`${styles.tierBadge} ${tierInfo.badgeClass}`}>
            {tierInfo.label}
          </span>
          {totalPlayers > 0 && (
            <span className={`${styles.rarityBadge} ${rarityInfo.className}`}>
              {rarityPercentage}% · {rarityInfo.label}
            </span>
          )}
          {gameName && <span className={styles.game}>{gameName}</span>}
        </div>
        {totalPlayers > 0 && (
          <div className={styles.rarityBar}>
            <div
              className={`${styles.rarityFill} ${rarityInfo.className}`}
              style={{ width: `${Math.min(rarityPercentage, 100)}%` }}
            />
          </div>
        )}
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
