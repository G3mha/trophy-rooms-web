"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import {
  Heart,
  BookMarked,
  Gamepad2,
  Pause,
  Trophy,
  XCircle,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  Trash2,
  Monitor,
} from "lucide-react";
import { SET_GAME_STATUS, CLEAR_GAME_STATUS } from "@/graphql/mutations";
import { GET_GAME_STATUS, GET_MY_GAMES_BY_STATUS } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import styles from "./GameStatusSelector.module.css";

export type GameStatus =
  | "WISHLIST"
  | "BACKLOG"
  | "PLAYING"
  | "PAUSED"
  | "COMPLETED"
  | "DROPPED";

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const STATUS_CONFIG: Record<GameStatus, StatusConfig> = {
  WISHLIST: { label: "Wishlist", icon: Heart, color: "#ef4444" },
  BACKLOG: { label: "Backlog", icon: BookMarked, color: "#f97316" },
  PLAYING: { label: "Playing", icon: Gamepad2, color: "#22c55e" },
  PAUSED: { label: "Paused", icon: Pause, color: "#a855f7" },
  COMPLETED: { label: "Completed", icon: Trophy, color: "#eab308" },
  DROPPED: { label: "Dropped", icon: XCircle, color: "#6b7280" },
};

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface GameStatusSelectorProps {
  gameId: string;
  variant?: "default" | "compact";
  className?: string;
}

export function GameStatusSelector({
  gameId,
  variant = "default",
  className = "",
}: GameStatusSelectorProps) {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<GameStatus | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading: queryLoading } = useQuery(GET_GAME_STATUS, {
    variables: { gameId },
    skip: !isSignedIn,
  });

  const { data: platformsData } = useQuery(GET_PLATFORMS, {
    skip: !isSignedIn,
  });

  const platforms: Platform[] = platformsData?.platforms ?? [];

  const [setGameStatus, { loading: settingStatus }] = useMutation(
    SET_GAME_STATUS,
    {
      refetchQueries: [
        { query: GET_GAME_STATUS, variables: { gameId } },
        { query: GET_MY_GAMES_BY_STATUS },
      ],
      onCompleted: (data) => {
        if (data.setGameStatus.success) {
          setCurrentStatus(data.setGameStatus.status);
          setSelectedPlatformId(data.setGameStatus.platformId);
          setIsOpen(false);
        }
      },
    }
  );

  const [clearGameStatus, { loading: clearingStatus }] = useMutation(
    CLEAR_GAME_STATUS,
    {
      refetchQueries: [
        { query: GET_GAME_STATUS, variables: { gameId } },
        { query: GET_MY_GAMES_BY_STATUS },
      ],
      onCompleted: (data) => {
        if (data.clearGameStatus.success) {
          setCurrentStatus(null);
          setSelectedPlatformId(null);
          setIsOpen(false);
        }
      },
    }
  );

  useEffect(() => {
    if (data?.getGameStatus) {
      setCurrentStatus(data.getGameStatus.status);
      setSelectedPlatformId(data.getGameStatus.platformId);
    } else if (data?.getGameStatus === null) {
      setCurrentStatus(null);
      setSelectedPlatformId(null);
    }
  }, [data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusSelect = async (status: GameStatus) => {
    if (settingStatus || clearingStatus) return;
    await setGameStatus({
      variables: { gameId, status, platformId: selectedPlatformId },
    });
  };

  const handlePlatformChange = (platformId: string | null) => {
    setSelectedPlatformId(platformId);
  };

  const handleRemove = async () => {
    if (settingStatus || clearingStatus) return;
    await clearGameStatus({ variables: { gameId } });
  };

  if (!isSignedIn) {
    return null;
  }

  const loading = queryLoading || settingStatus || clearingStatus;
  const statusConfig = currentStatus ? STATUS_CONFIG[currentStatus] : null;

  return (
    <div
      ref={dropdownRef}
      className={`${styles.container} ${styles[variant]} ${className}`}
    >
      <button
        className={`${styles.trigger} ${currentStatus ? styles.hasStatus : ""} ${loading ? styles.loading : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        style={
          statusConfig
            ? ({ "--status-color": statusConfig.color } as React.CSSProperties)
            : undefined
        }
      >
        <span className={styles.icon}>
          {statusConfig ? <statusConfig.icon size={16} /> : <Plus size={16} />}
        </span>
        <span className={styles.label}>
          {statusConfig ? statusConfig.label : "Add to Library"}
        </span>
        <span className={styles.chevron}>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {/* Platform Picker */}
          <div className={styles.platformSection}>
            <label className={styles.platformLabel}>
              <Monitor size={14} />
              <span>Platform (optional)</span>
            </label>
            <select
              className={styles.platformSelect}
              value={selectedPlatformId || ""}
              onChange={(e) =>
                handlePlatformChange(e.target.value || null)
              }
              disabled={loading}
            >
              <option value="">No platform</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.divider} />

          {/* Status Options */}
          {(Object.keys(STATUS_CONFIG) as GameStatus[]).map((status) => {
            const config = STATUS_CONFIG[status];
            const isSelected = currentStatus === status;
            const IconComponent = config.icon;

            return (
              <button
                key={status}
                className={`${styles.option} ${isSelected ? styles.selected : ""}`}
                onClick={() => handleStatusSelect(status)}
                disabled={loading}
                style={
                  { "--option-color": config.color } as React.CSSProperties
                }
              >
                <span className={styles.optionIcon}>
                  <IconComponent size={16} />
                </span>
                <span className={styles.optionLabel}>{config.label}</span>
                {isSelected && (
                  <span className={styles.checkmark}>
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}

          {currentStatus && (
            <>
              <div className={styles.divider} />
              <button
                className={`${styles.option} ${styles.removeOption}`}
                onClick={handleRemove}
                disabled={loading}
              >
                <span className={styles.optionIcon}>
                  <Trash2 size={16} />
                </span>
                <span className={styles.optionLabel}>Remove from Library</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
