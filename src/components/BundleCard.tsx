"use client";

import Link from "next/link";
import { Package, Gamepad2, Puzzle } from "lucide-react";
import styles from "./BundleCard.module.css";

interface BundleCardProps {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  coverUrl?: string | null;
  gameCount: number;
  dlcCount: number;
  compact?: boolean;
}

function getBundleTypeLabel(type: string): string {
  switch (type) {
    case "BUNDLE":
      return "Bundle";
    case "SEASON_PASS":
      return "Season Pass";
    case "COLLECTION":
      return "Collection";
    case "SUBSCRIPTION":
      return "Subscription";
    default:
      return type;
  }
}

function getBundleTypeClass(type: string): string {
  switch (type) {
    case "BUNDLE":
      return styles.typeBadgeBundle;
    case "SEASON_PASS":
      return styles.typeBadgeSeasonPass;
    case "COLLECTION":
      return styles.typeBadgeCollection;
    case "SUBSCRIPTION":
      return styles.typeBadgeSubscription;
    default:
      return "";
  }
}

export function BundleCard({
  id,
  name,
  type,
  description,
  coverUrl,
  gameCount,
  dlcCount,
  compact = false,
}: BundleCardProps) {
  return (
    <Link href={`/bundles/${id}`} className={`${styles.card} ${compact ? styles.compact : ""}`}>
      <div className={styles.imageContainer}>
        {coverUrl ? (
          <img src={coverUrl} alt={name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <Package size={compact ? 20 : 32} />
          </div>
        )}
        <div className={`${styles.typeBadge} ${getBundleTypeClass(type)}`}>
          {getBundleTypeLabel(type)}
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{name}</h3>
        {!compact && description && (
          <p className={styles.description}>{description}</p>
        )}
        {!compact && (
          <div className={styles.stats}>
            {gameCount > 0 && (
              <div className={styles.stat}>
                <Gamepad2 size={14} className={styles.statIcon} />
                <span>{gameCount} {gameCount === 1 ? "game" : "games"}</span>
              </div>
            )}
            {dlcCount > 0 && (
              <div className={styles.stat}>
                <Puzzle size={14} className={styles.statIcon} />
                <span>{dlcCount} {dlcCount === 1 ? "DLC" : "DLCs"}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
