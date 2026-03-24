"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";
import {
  Library,
  BookMarked,
  Gamepad2,
  Pause,
  Trophy,
  XCircle,
  X,
  Plus,
  Monitor,
} from "lucide-react";
import { GET_MY_GAMES_BY_STATUS } from "@/graphql/queries";
import { CLEAR_GAME_STATUS } from "@/graphql/mutations";
import { LoadingSpinner, EmptyState, Button } from "@/components";
import type { GameStatus } from "@/components/GameStatusSelector";
import styles from "./page.module.css";

interface UserGameItem {
  id: string;
  gameId: string;
  gameTitle: string;
  gameCoverUrl: string | null;
  gameDescription: string | null;
  achievementCount: number;
  platformId: string | null;
  platformName: string | null;
  platformSlug: string | null;
  status: GameStatus;
  addedAt: string;
  updatedAt: string;
}

type FilterStatus = GameStatus | "ALL";

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

interface StatusTabConfig {
  label: string;
  icon: IconComponent;
  value: FilterStatus;
}

const STATUS_TABS: StatusTabConfig[] = [
  { label: "All", icon: Library, value: "ALL" },
  { label: "Backlog", icon: BookMarked, value: "BACKLOG" },
  { label: "Playing", icon: Gamepad2, value: "PLAYING" },
  { label: "Paused", icon: Pause, value: "PAUSED" },
  { label: "Completed", icon: Trophy, value: "COMPLETED" },
  { label: "Dropped", icon: XCircle, value: "DROPPED" },
];

const STATUS_COLORS: Record<GameStatus, string> = {
  BACKLOG: "#f97316",
  PLAYING: "#22c55e",
  PAUSED: "#a855f7",
  COMPLETED: "#eab308",
  DROPPED: "#6b7280",
};

export default function LibraryPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");

  const { data, loading, refetch } = useQuery(GET_MY_GAMES_BY_STATUS, {
    variables: activeFilter === "ALL" ? {} : { status: activeFilter },
    skip: !isSignedIn,
  });

  const [clearGameStatus, { loading: removing }] = useMutation(
    CLEAR_GAME_STATUS,
    {
      onCompleted: () => refetch(),
    }
  );

  if (!isLoaded) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading your library..." />
      </div>
    );
  }

  const games: UserGameItem[] = data?.myGamesByStatus || [];

  const handleRemove = async (gameId: string) => {
    await clearGameStatus({ variables: { gameId } });
  };

  const getStatusLabel = (status: GameStatus): string => {
    const tab = STATUS_TABS.find((t) => t.value === status);
    return tab?.label || status;
  };

  const getStatusIcon = (status: GameStatus): IconComponent => {
    const tab = STATUS_TABS.find((t) => t.value === status);
    return tab?.icon || Plus;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Library</h1>
        <p className={styles.subtitle}>
          Track and organize your gaming journey
        </p>
      </header>

      {/* Status Filter Tabs */}
      <div className={styles.tabs}>
        {STATUS_TABS.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.value}
              className={`${styles.tab} ${activeFilter === tab.value ? styles.tabActive : ""}`}
              onClick={() => setActiveFilter(tab.value)}
            >
              <span className={styles.tabIcon}>
                <TabIcon size={16} />
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {games.length > 0 ? (
        <div className={styles.gamesGrid}>
          {games.map((item) => {
            const StatusIcon = getStatusIcon(item.status);
            return (
              <div key={item.id} className={styles.gameCard}>
                <Link href={`/games/${item.gameId}`} className={styles.gameLink}>
                  <div className={styles.coverContainer}>
                    {item.gameCoverUrl ? (
                      <img
                        src={item.gameCoverUrl}
                        alt={item.gameTitle}
                        className={styles.cover}
                      />
                    ) : (
                      <div className={styles.coverPlaceholder}>
                        <Gamepad2 size={32} />
                      </div>
                    )}
                    <div
                      className={styles.statusBadge}
                      style={
                        {
                          "--badge-color": STATUS_COLORS[item.status],
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.statusIcon}>
                        <StatusIcon size={12} />
                      </span>
                      <span className={styles.statusLabel}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.cardContent}>
                    <h3 className={styles.gameTitle}>{item.gameTitle}</h3>
                    {item.platformName && (
                      <div className={styles.platformBadge}>
                        {item.platformSlug ? (
                          <img
                            src={`/platforms/${item.platformSlug}.svg`}
                            alt={item.platformName}
                            className={styles.platformIcon}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Monitor size={12} />
                        )}
                        <span>{item.platformName}</span>
                      </div>
                    )}
                    {item.gameDescription && (
                      <p className={styles.gameDescription}>
                        {item.gameDescription}
                      </p>
                    )}
                    <div className={styles.gameMeta}>
                      <span className={styles.achievementCount}>
                        {item.achievementCount} achievements
                      </span>
                      <span className={styles.addedDate}>
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemove(item.gameId)}
                  disabled={removing}
                  title="Remove from library"
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={(() => {
            const EmptyIcon =
              activeFilter === "ALL"
                ? Library
                : getStatusIcon(activeFilter as GameStatus);
            return <EmptyIcon size={48} />;
          })()}
          title={
            activeFilter === "ALL"
              ? "Your library is empty"
              : `No ${getStatusLabel(activeFilter as GameStatus).toLowerCase()} games`
          }
          description={
            activeFilter === "ALL"
              ? "Browse games and add them to your library to track your gaming journey."
              : `You don't have any games marked as ${getStatusLabel(activeFilter as GameStatus).toLowerCase()}.`
          }
          action={
            activeFilter === "ALL" ? (
              <Button href="/games">Browse Games</Button>
            ) : (
              <Button onClick={() => setActiveFilter("ALL")} variant="secondary">
                View All Games
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
