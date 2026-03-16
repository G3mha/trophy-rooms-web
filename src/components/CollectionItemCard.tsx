"use client";

import Link from "next/link";
import { Disc, Package, BookOpen, Gift, Lock, Pencil, Trash2 } from "lucide-react";
import styles from "./CollectionItemCard.module.css";

export type GameRegion = "NTSC_U" | "PAL" | "NTSC_J" | "OTHER";

const REGION_LABELS: Record<GameRegion, string> = {
  NTSC_U: "NTSC-U",
  PAL: "PAL",
  NTSC_J: "NTSC-J",
  OTHER: "Other",
};

const REGION_COLORS: Record<GameRegion, string> = {
  NTSC_U: "#3b82f6",
  PAL: "#22c55e",
  NTSC_J: "#ef4444",
  OTHER: "#6b7280",
};

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface Game {
  id: string;
  title: string;
  coverUrl?: string | null;
}

interface CollectionItemCardProps {
  game: Game;
  platform?: Platform | null;
  hasDisc: boolean;
  hasBox: boolean;
  hasManual: boolean;
  hasExtras: boolean;
  isSealed: boolean;
  region: GameRegion;
  notes?: string | null;
  onEdit?: () => void;
  onRemove?: () => void;
}

export function CollectionItemCard({
  game,
  platform,
  hasDisc,
  hasBox,
  hasManual,
  hasExtras,
  isSealed,
  region,
  notes,
  onEdit,
  onRemove,
}: CollectionItemCardProps) {
  const isComplete = hasDisc && hasBox && hasManual;

  return (
    <div className={styles.card}>
      <Link href={`/games/${game.id}`} className={styles.imageContainer}>
        {game.coverUrl ? (
          <img src={game.coverUrl} alt={game.title} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <Disc size={32} />
          </div>
        )}
        <div
          className={styles.regionBadge}
          style={{ "--region-color": REGION_COLORS[region] } as React.CSSProperties}
        >
          {REGION_LABELS[region]}
        </div>
        {isSealed && (
          <div className={styles.sealedBadge}>
            <Lock size={10} />
            <span>SEALED</span>
          </div>
        )}
      </Link>

      <div className={styles.content}>
        <Link href={`/games/${game.id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{game.title}</h3>
        </Link>

        {platform && (
          <div className={styles.platform}>
            <img
              src={`/platforms/${platform.slug}.svg`}
              alt={platform.name}
              className={styles.platformIcon}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span>{platform.name}</span>
          </div>
        )}

        <div className={styles.components}>
          <div
            className={`${styles.component} ${hasDisc ? styles.hasComponent : ""}`}
            title="Disc"
          >
            <Disc size={14} />
          </div>
          <div
            className={`${styles.component} ${hasBox ? styles.hasComponent : ""}`}
            title="Box"
          >
            <Package size={14} />
          </div>
          <div
            className={`${styles.component} ${hasManual ? styles.hasComponent : ""}`}
            title="Manual"
          >
            <BookOpen size={14} />
          </div>
          <div
            className={`${styles.component} ${hasExtras ? styles.hasComponent : ""}`}
            title="Extras"
          >
            <Gift size={14} />
          </div>
          {isComplete && <span className={styles.completeLabel}>Complete</span>}
        </div>

        {notes && <p className={styles.notes}>{notes}</p>}

        <div className={styles.actions}>
          {onEdit && (
            <button
              className={styles.actionButton}
              onClick={onEdit}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
          {onRemove && (
            <button
              className={`${styles.actionButton} ${styles.removeButton}`}
              onClick={onRemove}
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
