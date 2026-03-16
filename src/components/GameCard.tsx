"use client";

import Link from "next/link";
import { Gamepad2, Trophy, Star } from "lucide-react";
import styles from "./GameCard.module.css";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface GameCardProps {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  achievementCount: number;
  trophyCount: number;
  platform?: Platform | null;
}

export function GameCard({
  id,
  title,
  description,
  coverUrl,
  achievementCount,
  trophyCount,
  platform,
}: GameCardProps) {
  return (
    <Link href={`/games/${id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        {coverUrl ? (
          <img src={coverUrl} alt={title} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <Gamepad2 size={32} />
          </div>
        )}
        {trophyCount > 0 && (
          <div className={styles.trophyBadge}>
            <Trophy size={14} />
            <span>{trophyCount}</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <Star size={14} className={styles.statIcon} />
            <span>{achievementCount} achievements</span>
          </div>
          {platform && (
            <div className={styles.stat}>
              <img
                src={`/platforms/${platform.slug}.svg`}
                alt={platform.name}
                className={styles.platformIcon}
                onError={(e) => {
                  // Hide icon if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span>{platform.name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
