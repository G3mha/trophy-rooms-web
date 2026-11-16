"use client";

import { useState } from "react";
import { Eye, EyeOff, Trophy } from "lucide-react";
import { AppImage } from "./AppImage";
import styles from "./AchievementCard.module.css";

export type AchievementTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

interface AchievementCardProps {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  tier?: AchievementTier;
  isCompleted?: boolean;
  // Share of the game's players who earned it. Null when nobody has the game.
  earnedPercent?: number | null;
  gameName?: string;
  onToggle?: (id: string) => void;
  loading?: boolean;
}

const TIER_COLORS: Record<AchievementTier, string> = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  PLATINUM: "#E5E4E2",
};

const tierConfig: Record<AchievementTier, {
  label: string;
  cardClass: string;
  badgeClass: string;
  color: string;
  iconClass: string;
}> = {
  BRONZE: {
    label: "Bronze",
    cardClass: styles.tierBronze,
    badgeClass: styles.badgeBronze,
    color: TIER_COLORS.BRONZE,
    iconClass: styles.iconBronze,
  },
  SILVER: {
    label: "Silver",
    cardClass: styles.tierSilver,
    badgeClass: styles.badgeSilver,
    color: TIER_COLORS.SILVER,
    iconClass: styles.iconSilver,
  },
  GOLD: {
    label: "Gold",
    cardClass: styles.tierGold,
    badgeClass: styles.badgeGold,
    color: TIER_COLORS.GOLD,
    iconClass: styles.iconGold,
  },
  PLATINUM: {
    label: "Platinum",
    cardClass: styles.tierPlatinum,
    badgeClass: styles.badgePlatinum,
    color: TIER_COLORS.PLATINUM,
    iconClass: styles.iconPlatinum,
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
  tier = "BRONZE",
  isCompleted = false,
  earnedPercent = null,
  gameName,
  onToggle,
  loading = false,
}: AchievementCardProps) {
  const tierInfo = tierConfig[tier];
  // Descriptions can spoil the game, so each one stays hidden until asked for
  const [showDescription, setShowDescription] = useState(false);

  const hasRarity = earnedPercent != null;
  const rarityPercentage = earnedPercent ?? 0;
  const rarityInfo = getRarityLabel(rarityPercentage);

  return (
    <div className={`${styles.card} ${tierInfo.cardClass} ${isCompleted ? styles.completed : ""}`}>
      <div className={`${styles.icon} ${tierInfo.iconClass} ${isCompleted ? styles.iconCompleted : ""}`}>
        <AppImage
          src={iconUrl}
          alt={title}
          className={styles.iconImage}
          fallback={
            <Trophy className={styles.tierIcon} size={24} color={tierInfo.color} />
          }
        />
        {!isCompleted && <div className={styles.iconShade} />}
      </div>
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <h4 className={styles.title}>{title}</h4>
          {description && (
            <button
              type="button"
              className={styles.revealBtn}
              onClick={() => setShowDescription((shown) => !shown)}
              aria-expanded={showDescription}
              aria-label={showDescription ? "Hide description" : "Show description"}
            >
              {showDescription ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {description && showDescription && (
          <p className={styles.description}>{description}</p>
        )}
        <div className={styles.meta}>
          <span className={`${styles.tierBadge} ${tierInfo.badgeClass}`}>
            {tierInfo.label}
          </span>
          {hasRarity && (
            <span className={`${styles.rarityBadge} ${rarityInfo.className}`}>
              {rarityPercentage}% · {rarityInfo.label}
            </span>
          )}
          {gameName && <span className={styles.game}>{gameName}</span>}
        </div>
        {hasRarity && (
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
