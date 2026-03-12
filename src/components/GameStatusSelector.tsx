"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { SET_GAME_STATUS, CLEAR_GAME_STATUS } from "@/graphql/mutations";
import { GET_GAME_STATUS, GET_MY_GAMES_BY_STATUS } from "@/graphql/queries";
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
  icon: string;
  color: string;
}

const STATUS_CONFIG: Record<GameStatus, StatusConfig> = {
  WISHLIST: { label: "Wishlist", icon: "💖", color: "#ef4444" },
  BACKLOG: { label: "Backlog", icon: "📚", color: "#f97316" },
  PLAYING: { label: "Playing", icon: "🎮", color: "#22c55e" },
  PAUSED: { label: "Paused", icon: "⏸️", color: "#a855f7" },
  COMPLETED: { label: "Completed", icon: "🏆", color: "#eab308" },
  DROPPED: { label: "Dropped", icon: "❌", color: "#6b7280" },
};

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading: queryLoading } = useQuery(GET_GAME_STATUS, {
    variables: { gameId },
    skip: !isSignedIn,
  });

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
          setIsOpen(false);
        }
      },
    }
  );

  useEffect(() => {
    if (data?.getGameStatus !== undefined) {
      setCurrentStatus(data.getGameStatus);
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
    await setGameStatus({ variables: { gameId, status } });
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
          {statusConfig ? statusConfig.icon : "📋"}
        </span>
        <span className={styles.label}>
          {statusConfig ? statusConfig.label : "Add to Library"}
        </span>
        <span className={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {(Object.keys(STATUS_CONFIG) as GameStatus[]).map((status) => {
            const config = STATUS_CONFIG[status];
            const isSelected = currentStatus === status;

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
                <span className={styles.optionIcon}>{config.icon}</span>
                <span className={styles.optionLabel}>{config.label}</span>
                {isSelected && <span className={styles.checkmark}>✓</span>}
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
                <span className={styles.optionIcon}>🗑️</span>
                <span className={styles.optionLabel}>Remove from Library</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
