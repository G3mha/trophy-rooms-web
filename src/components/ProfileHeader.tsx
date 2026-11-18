"use client";

import { Trophy, Share2, Pencil } from "lucide-react";
import { getDisplayName } from "@/lib/avatar-utils";
import { SOCIAL_NETWORKS, socialLabel, type SocialLink } from "@/lib/profile";
import { AppImage } from "./AppImage";
import { Button } from "./Button";
import styles from "./ProfileHeader.module.css";

interface UserStats {
  platinumCount?: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  completionRate: number;
}

interface ProfileHeaderProps {
  name: string | null | undefined;
  userId: string;
  memberSince: string;
  achievementCount: number;
  trophyCount: number;
  gamesPlayed: number;
  stats?: UserStats;
  isOwnProfile?: boolean;
  onShare?: () => void;
  avatarUrl?: string | null;
  bio?: string | null;
  socialLinks?: SocialLink[];
}

function getInitials(name: string | null | undefined, userId: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return userId.slice(-2).toUpperCase();
}

export function getAvatarColor(name: string | null | undefined, userId: string): string {
  const str = name || userId;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Cabinet tints only. Crimson is deliberately absent: every colour here
  // carries dark ink initials, and crimson is the one tint that needs light
  // text instead.
  const colors = [
    "#c9a45c", // brass
    "#769dba", // steel
    "#a383b3", // plum
    "#d9a25a", // amber
    "#80b37e", // sage
    "#da854a", // burnt orange
    "#8b7e6d", // warm gray
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function ProfileHeader({
  name,
  userId,
  memberSince,
  achievementCount,
  trophyCount,
  gamesPlayed,
  stats,
  isOwnProfile = false,
  onShare,
  avatarUrl,
  bio,
  socialLinks = [],
}: ProfileHeaderProps) {
  const networkOrder = SOCIAL_NETWORKS.map((n) => n.network as string);
  const sortedLinks = [...socialLinks].sort(
    (a, b) => networkOrder.indexOf(a.network) - networkOrder.indexOf(b.network)
  );
  const displayName = getDisplayName(name, userId);
  const formattedDate = new Date(memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const tiers = stats
    ? [
        { key: "platinum", label: "Platinum", count: stats.platinumCount ?? 0 },
        { key: "gold", label: "Gold", count: stats.goldCount },
        { key: "silver", label: "Silver", count: stats.silverCount },
        { key: "bronze", label: "Bronze", count: stats.bronzeCount },
      ]
    : [];
  const tierTotal = tiers.reduce((sum, tier) => sum + tier.count, 0);

  return (
    <section className={styles.plate} aria-label="Profile">
      {isOwnProfile && (
        <div className={styles.actions}>
          <Button variant="secondary" size="sm" href="/profile">
            <Pencil size={15} aria-hidden /> Edit profile
          </Button>
          {onShare && (
            <Button variant="secondary" size="icon" aria-label="Share profile" onClick={onShare}>
              <Share2 size={16} aria-hidden />
            </Button>
          )}
        </div>
      )}

      <div className={styles.identity}>
        <div className={styles.avatar} style={{ backgroundColor: getAvatarColor(name, userId) }}>
          <AppImage
            src={avatarUrl}
            alt=""
            className={styles.avatarImage}
            fallback={<span className={styles.initials}>{getInitials(name, userId)}</span>}
          />
          {trophyCount >= 10 && (
            <span className={styles.badge} title="Platinum Master">
              <Trophy size={14} aria-label="Platinum Master" />
            </span>
          )}
        </div>
        <div className={styles.nameBlock}>
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.memberSince}>Member since {formattedDate}</p>
        </div>
      </div>

      {(bio || sortedLinks.length > 0) && (
        <div className={styles.about}>
          {bio && <p className={styles.bio}>{bio}</p>}
          {sortedLinks.length > 0 && (
            <ul className={styles.socialLinks}>
              {sortedLinks.map((link) => (
                <li key={link.id} className={styles.social}>
                  <span className={styles.socialNetwork}>{socialLabel(link.network)}</span>
                  {link.url ? (
                    <a
                      className={styles.socialHandle}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      {link.handle}
                    </a>
                  ) : (
                    <span className={styles.socialHandle}>{link.handle}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.ledger}>
        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Platinums</dt>
            <dd>{trophyCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Trophies</dt>
            <dd>{achievementCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Games</dt>
            <dd>{gamesPlayed}</dd>
          </div>
          {stats && (
            <div className={styles.stat}>
              <dt>Completion</dt>
              <dd>{stats.completionRate}%</dd>
            </div>
          )}
        </dl>

        {tierTotal > 0 && (
          <div className={styles.tiers}>
            <div className={styles.tierBar} aria-hidden>
              {tiers.map(
                (tier) =>
                  tier.count > 0 && (
                    <span
                      key={tier.key}
                      className={styles[tier.key]}
                      style={{ flexGrow: tier.count }}
                    />
                  )
              )}
            </div>
            <ul className={styles.tierLegend} aria-label="Trophies by tier">
              {tiers.map((tier) => (
                <li key={tier.key}>
                  <span className={`${styles.tierDot} ${styles[tier.key]}`} aria-hidden />
                  {tier.label}
                  <strong>{tier.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
