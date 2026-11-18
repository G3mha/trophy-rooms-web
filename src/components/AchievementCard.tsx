"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Trophy } from "lucide-react";
import { AppImage } from "./AppImage";
import styles from "./AchievementCard.module.css";

export type AchievementTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

interface AchievementCardProps {
  id: string;
  title: string;
  description?: string | null;
  iconUrl?: string | null;
  tier?: AchievementTier;
  // Undefined when there's no viewer to have earned it, e.g. signed out
  isCompleted?: boolean;
  // Share of the game's players who earned it. Null until enough people have the game.
  earnedPercent?: number | null;
  gameName?: string;
  // Shows the description without the per-trophy reveal
  revealDescription?: boolean;
  onToggle?: (id: string) => void;
}

const TIERS: Record<AchievementTier, { label: string; className: string; color: string }> = {
  BRONZE: { label: "Bronze", className: styles.bronze, color: "#cd7f32" },
  SILVER: { label: "Silver", className: styles.silver, color: "#c0c0c0" },
  GOLD: { label: "Gold", className: styles.gold, color: "#ffd700" },
  PLATINUM: { label: "Platinum", className: styles.platinum, color: "#e5e4e2" },
};

export function AchievementCard({
  id,
  title,
  description,
  iconUrl,
  tier = "BRONZE",
  isCompleted,
  earnedPercent = null,
  gameName,
  revealDescription = false,
  onToggle,
}: AchievementCardProps) {
  const tierInfo = TIERS[tier];
  // Descriptions can spoil the game, so each one stays hidden until asked for
  const [showDescription, setShowDescription] = useState(false);
  const descriptionShown = revealDescription || showDescription;
  const stateClass = isCompleted ? styles.earned : isCompleted === false ? styles.locked : "";

  return (
    <div className={`${styles.card} ${stateClass}`}>
      {onToggle && (
        <button
          type="button"
          className={styles.check}
          onClick={() => onToggle(id)}
          aria-pressed={isCompleted}
          aria-label={`${title} earned`}
        >
          <span className={styles.checkMark}>{isCompleted && <Check size={16} strokeWidth={3} />}</span>
        </button>
      )}
      <div className={`${styles.icon} ${tierInfo.className}`}>
        <AppImage
          src={iconUrl}
          alt=""
          className={styles.iconImage}
          fallback={<Trophy size={20} color={tierInfo.color} />}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.titleRow}>
          <h4 className={styles.title}>
            {title}
            <span className="sr-only">, {tierInfo.label}</span>
          </h4>
          {description && !revealDescription && (
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
        {description && descriptionShown && <p className={styles.description}>{description}</p>}
        {(earnedPercent != null || gameName) && (
          <p className={styles.meta}>
            {gameName && <span className={styles.game}>{gameName}</span>}
            {earnedPercent != null && <span>{earnedPercent}% of players</span>}
          </p>
        )}
      </div>
    </div>
  );
}
