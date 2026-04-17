"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
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
  AlertTriangle,
} from "lucide-react";
import { handlePlatformIconError } from "@/lib/image-utils";
import { GET_MY_GAMES_BY_STATUS } from "@/graphql/queries";
import { CLEAR_GAME_STATUS } from "@/graphql/mutations";
import { LoadingSpinner, EmptyState, AppImage, Button, FilterTabs, type FilterTab } from "@/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button as ShadcnButton } from "@/components/ui/button";
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

const STATUS_TABS: FilterTab<FilterStatus>[] = [
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
  const [gameToRemove, setGameToRemove] = useState<UserGameItem | null>(null);

  const { data, loading, refetch } = useQuery(GET_MY_GAMES_BY_STATUS, {
    variables: activeFilter === "ALL" ? {} : { status: activeFilter },
    skip: !isSignedIn,
  });

  const [clearGameStatus, { loading: removing }] = useMutation(
    CLEAR_GAME_STATUS,
    {
      onCompleted: () => {
        refetch();
        toast.success("Game removed from library.");
      },
      onError: (error) => toast.error(error.message || "Failed to remove game."),
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

  const handleRemove = async () => {
    if (!gameToRemove) return;
    await clearGameStatus({ variables: { gameId: gameToRemove.gameId } });
    setGameToRemove(null);
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
      <FilterTabs
        tabs={STATUS_TABS}
        value={activeFilter}
        onChange={setActiveFilter}
        className={styles.tabs}
      />

      {games.length > 0 ? (
        <div className={styles.gamesGrid}>
          {games.map((item) => {
            const StatusIcon = getStatusIcon(item.status);
            return (
              <div key={item.id} className={styles.gameCard}>
                <Link href={`/games/${item.gameId}`} className={styles.gameLink}>
                  <div className={styles.coverContainer}>
                    <AppImage
                      src={item.gameCoverUrl}
                      alt={item.gameTitle}
                      className={styles.cover}
                      fallback={
                        <div className={styles.coverPlaceholder}>
                          <Gamepad2 size={32} />
                        </div>
                      }
                    />
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
                          <AppImage
                            src={`/platforms/${item.platformSlug}.svg`}
                            alt={item.platformName}
                            className={styles.platformIcon}
                            onError={handlePlatformIconError}
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
                  onClick={() => setGameToRemove(item)}
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

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!gameToRemove} onOpenChange={(open) => !open && setGameToRemove(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className={styles.dialogIcon}>
              <AlertTriangle size={24} />
            </div>
            <DialogTitle>Remove from Library?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{gameToRemove?.gameTitle}</strong> from your library? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<ShadcnButton variant="secondary" />}>
              Cancel
            </DialogClose>
            <ShadcnButton
              variant="destructive"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? "Removing..." : "Remove"}
            </ShadcnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
