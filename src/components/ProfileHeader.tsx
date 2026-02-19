"use client";

import styles from "./ProfileHeader.module.css";

interface UserStats {
  totalPoints: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  completionRate: number;
  averagePointsPerGame: number;
}

interface ProfileHeaderProps {
  name: string | null | undefined;
  email: string;
  memberSince: string;
  achievementCount: number;
  trophyCount: number;
  gamesPlayed: number;
  stats?: UserStats;
  isOwnProfile?: boolean;
  onShare?: () => void;
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string | null | undefined, email: string): string {
  const str = name || email;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#e60012", // Nintendo red
    "#00a651", // Green
    "#0066b3", // Blue
    "#f5a623", // Orange
    "#9b59b6", // Purple
    "#e91e63", // Pink
    "#00bcd4", // Cyan
  ];
  return colors[Math.abs(hash) % colors.length];
}

export function ProfileHeader({
  name,
  email,
  memberSince,
  achievementCount,
  trophyCount,
  gamesPlayed,
  stats,
  isOwnProfile = false,
  onShare,
}: ProfileHeaderProps) {
  const initials = getInitials(name, email);
  const avatarColor = getAvatarColor(name, email);
  const displayName = name || email.split("@")[0];

  const memberDate = new Date(memberSince);
  const formattedDate = memberDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={styles.header}>
      <div className={styles.profileCard}>
        {/* Avatar */}
        <div
          className={styles.avatar}
          style={{ backgroundColor: avatarColor }}
        >
          <span className={styles.initials}>{initials}</span>
          {trophyCount >= 10 && (
            <div className={styles.badge} title="Trophy Master">🏆</div>
          )}
        </div>

        {/* Profile Info */}
        <div className={styles.info}>
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.memberSince}>Member since {formattedDate}</p>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{trophyCount}</span>
              <span className={styles.quickStatLabel}>Trophies</span>
            </div>
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{achievementCount}</span>
              <span className={styles.quickStatLabel}>Achievements</span>
            </div>
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{gamesPlayed}</span>
              <span className={styles.quickStatLabel}>Games</span>
            </div>
            {stats && (
              <div className={styles.quickStat}>
                <span className={styles.quickStatValue}>{stats.totalPoints.toLocaleString()}</span>
                <span className={styles.quickStatLabel}>Points</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwnProfile && onShare && (
          <button className={styles.shareButton} onClick={onShare}>
            📤 Share Profile
          </button>
        )}
      </div>

      {/* Tier Distribution */}
      {stats && (stats.goldCount > 0 || stats.silverCount > 0 || stats.bronzeCount > 0) && (
        <div className={styles.tierDistribution}>
          <h3 className={styles.tierTitle}>Achievement Breakdown</h3>
          <div className={styles.tierBars}>
            <div className={styles.tierBar}>
              <div className={styles.tierLabel}>
                <span className={styles.tierIcon}>🥇</span>
                <span>Gold</span>
                <span className={styles.tierCount}>{stats.goldCount}</span>
              </div>
              <div className={styles.barContainer}>
                <div
                  className={`${styles.barFill} ${styles.barGold}`}
                  style={{
                    width: `${achievementCount > 0 ? (stats.goldCount / achievementCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className={styles.tierBar}>
              <div className={styles.tierLabel}>
                <span className={styles.tierIcon}>🥈</span>
                <span>Silver</span>
                <span className={styles.tierCount}>{stats.silverCount}</span>
              </div>
              <div className={styles.barContainer}>
                <div
                  className={`${styles.barFill} ${styles.barSilver}`}
                  style={{
                    width: `${achievementCount > 0 ? (stats.silverCount / achievementCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className={styles.tierBar}>
              <div className={styles.tierLabel}>
                <span className={styles.tierIcon}>🥉</span>
                <span>Bronze</span>
                <span className={styles.tierCount}>{stats.bronzeCount}</span>
              </div>
              <div className={styles.barContainer}>
                <div
                  className={`${styles.barFill} ${styles.barBronze}`}
                  style={{
                    width: `${achievementCount > 0 ? (stats.bronzeCount / achievementCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Extra Stats */}
          <div className={styles.extraStats}>
            <div className={styles.extraStat}>
              <span className={styles.extraStatValue}>{stats.completionRate}%</span>
              <span className={styles.extraStatLabel}>Completion Rate</span>
            </div>
            <div className={styles.extraStat}>
              <span className={styles.extraStatValue}>{stats.averagePointsPerGame}</span>
              <span className={styles.extraStatLabel}>Avg Points/Game</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
