"use client";

import Link from "next/link";
import { Gamepad2, Trophy, Star } from "lucide-react";
import { handlePlatformIconError } from "@/lib/image-utils";
import { AppImage } from "./AppImage";
import styles from "./GroupedGameCard.module.css";

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface GroupedGameCardProps {
  title: string;
  slug: string;
  coverUrl?: string | null;
  platforms: Platform[];
  totalAchievementCount: number;
  totalTrophyCount: number;
}

const MAX_PLATFORM_ICONS = 4;

export function GroupedGameCard({
  title,
  slug,
  coverUrl,
  platforms,
  totalAchievementCount,
  totalTrophyCount,
}: GroupedGameCardProps) {
  const displayPlatforms = platforms.slice(0, MAX_PLATFORM_ICONS);
  const remainingCount = platforms.length - MAX_PLATFORM_ICONS;

  return (
    <Link href={`/games/title/${slug}`} className={styles.card}>
      <div className={styles.imageContainer}>
        <AppImage
          src={coverUrl}
          alt={title}
          className={styles.image}
          fallback={
            <div className={styles.placeholder}>
              <Gamepad2 size={32} />
            </div>
          }
        />
        {totalTrophyCount > 0 && (
          <div className={styles.trophyBadge}>
            <Trophy size={14} />
            <span>{totalTrophyCount}</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <Star size={14} className={styles.statIcon} />
            <span>{totalAchievementCount} achievements</span>
          </div>
        </div>
        <div className={styles.platformsRow}>
          {displayPlatforms.map((platform) => (
            <AppImage
              key={platform.id}
              src={`/platforms/${platform.slug}.svg`}
              alt={platform.name}
              title={platform.name}
              className={styles.platformIcon}
              onError={handlePlatformIconError}
            />
          ))}
          {remainingCount > 0 && (
            <span className={styles.moreCount}>+{remainingCount}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
