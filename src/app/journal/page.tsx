"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { toast } from "sonner";
import { CalendarClock, Flame, Clock, Minus, Plus, Trash2 } from "lucide-react";
import { GET_MY_PLAY_JOURNAL, GET_MY_GAMES_BY_STATUS } from "@/graphql/queries";
import { LOG_PLAY_SESSION, DELETE_PLAY_SESSION } from "@/graphql/mutations";
import { LoadingSpinner, EmptyState, Button, AppImage } from "@/components";
import styles from "./page.module.css";

interface PlaySessionData {
  id: string;
  gameId: string;
  game: {
    id: string;
    title: string;
    coverUrl: string | null;
    platform: { id: string; name: string; slug: string | null } | null;
  };
  playedOn: string;
  minutes: number;
  notes: string | null;
}

interface LibraryGameData {
  id: string;
  gameId: string;
  gameTitle: string;
  status: string;
}

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 180];

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function localDayString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayLabel(key: string): string {
  const today = localDayString(new Date());
  const yesterday = localDayString(new Date(Date.now() - 86400000));
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function JournalPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const { data, loading, refetch } = useQuery(GET_MY_PLAY_JOURNAL, {
    skip: !isSignedIn,
  });
  const { data: libraryData } = useQuery(GET_MY_GAMES_BY_STATUS, {
    skip: !isSignedIn,
  });

  const [logPlaySession, { loading: logging }] = useMutation(LOG_PLAY_SESSION);
  const [deletePlaySession] = useMutation(DELETE_PLAY_SESSION);

  const [selectedGameId, setSelectedGameId] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [dayChoice, setDayChoice] = useState<"today" | "yesterday" | "other">("today");
  const [customDate, setCustomDate] = useState(localDayString(new Date()));
  const [notes, setNotes] = useState("");

  const sessions: PlaySessionData[] = useMemo(
    () => data?.myPlaySessions ?? [],
    [data]
  );
  const stats = data?.myPlayStats;

  const libraryGames: LibraryGameData[] = useMemo(() => {
    const items: LibraryGameData[] = libraryData?.myGamesByStatus ?? [];
    const recent = sessions.slice(0, 30).map((s) => s.gameId);
    const rank = (item: LibraryGameData): [number, number] => {
      if (item.status === "PLAYING") return [0, 0];
      const idx = recent.indexOf(item.gameId);
      if (idx >= 0) return [1, idx];
      return [2, 0];
    };
    return [...items].sort((a, b) => {
      const [ra, ia] = rank(a);
      const [rb, ib] = rank(b);
      if (ra !== rb) return ra - rb;
      if (ia !== ib) return ia - ib;
      return a.gameTitle.localeCompare(b.gameTitle);
    });
  }, [libraryData, sessions]);

  const dayGroups = useMemo(() => {
    const order: string[] = [];
    const grouped = new Map<string, PlaySessionData[]>();
    for (const session of sessions) {
      const key = dayKey(session.playedOn);
      if (!grouped.has(key)) {
        grouped.set(key, []);
        order.push(key);
      }
      grouped.get(key)!.push(session);
    }
    return order.map((key) => ({
      key,
      label: dayLabel(key),
      sessions: grouped.get(key)!,
      total: grouped.get(key)!.reduce((sum, s) => sum + s.minutes, 0),
    }));
  }, [sessions]);

  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <RedirectToSignIn />;

  const playedOn = () => {
    if (dayChoice === "today") return localDayString(new Date());
    if (dayChoice === "yesterday") return localDayString(new Date(Date.now() - 86400000));
    return customDate;
  };

  const handleLog = async () => {
    if (!selectedGameId) {
      toast.error("Pick a game first");
      return;
    }
    const result = await logPlaySession({
      variables: {
        input: {
          gameId: selectedGameId,
          playedOn: `${playedOn()}T00:00:00.000Z`,
          minutes,
          notes: notes.trim() || null,
        },
      },
    });
    if (result.data?.logPlaySession?.success) {
      toast.success(`Logged ${formatMinutes(minutes)}`);
      setNotes("");
      refetch();
    } else {
      toast.error(result.data?.logPlaySession?.error?.message ?? "Failed to log session");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deletePlaySession({ variables: { id } });
    if (result.data?.deletePlaySession?.success) {
      refetch();
    } else {
      toast.error("Failed to delete session");
    }
  };

  return (
    <div className={styles.container}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <CalendarClock size={22} /> Play Journal
      </h1>

      {stats && (
        <div className={styles.statsRow}>
          <div className={styles.statTile}>
            <Flame size={16} color="#f5a623" />
            <span className={styles.statValue}>
              {stats.currentStreakDays} {stats.currentStreakDays === 1 ? "day" : "days"}
            </span>
            <span className={styles.statLabel}>Streak</span>
          </div>
          <div className={styles.statTile}>
            <CalendarClock size={16} />
            <span className={styles.statValue}>{formatMinutes(stats.thisWeekMinutes)}</span>
            <span className={styles.statLabel}>This Week</span>
          </div>
          <div className={styles.statTile}>
            <Clock size={16} />
            <span className={styles.statValue}>{formatMinutes(stats.totalMinutes)}</span>
            <span className={styles.statLabel}>All Time</span>
          </div>
        </div>
      )}

      <div className={styles.logCard}>
        <span className={styles.logTitle}>Log a session</span>

        <div>
          <div className={styles.fieldLabel}>Game</div>
          <select
            className={styles.select}
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            <option value="">Select a game…</option>
            {libraryGames.map((game) => (
              <option key={game.id} value={game.gameId}>
                {game.status === "PLAYING" ? "▶ " : ""}
                {game.gameTitle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className={styles.fieldLabel}>How long</div>
          <div className={styles.chipRow}>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setMinutes((m) => Math.max(15, m - 15))}
            >
              <Minus size={14} />
            </button>
            <span className={styles.durationDisplay}>{formatMinutes(minutes)}</span>
            <button
              type="button"
              className={styles.stepBtn}
              onClick={() => setMinutes((m) => Math.min(1440, m + 15))}
            >
              <Plus size={14} />
            </button>
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`${styles.chip} ${minutes === preset ? styles.chipActive : ""}`}
                onClick={() => setMinutes(preset)}
              >
                {formatMinutes(preset)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className={styles.fieldLabel}>When</div>
          <div className={styles.chipRow}>
            {(["today", "yesterday", "other"] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                className={`${styles.chip} ${dayChoice === choice ? styles.chipActive : ""}`}
                onClick={() => setDayChoice(choice)}
              >
                {choice === "today" ? "Today" : choice === "yesterday" ? "Yesterday" : "Other"}
              </button>
            ))}
            {dayChoice === "other" && (
              <input
                type="date"
                className={styles.input}
                style={{ width: "auto" }}
                max={localDayString(new Date())}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            )}
          </div>
        </div>

        <div>
          <div className={styles.fieldLabel}>Notes (optional)</div>
          <input
            className={styles.input}
            placeholder="Beat the water temple…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button onClick={handleLog} disabled={logging || !selectedGameId}>
          Log {formatMinutes(minutes)}
        </Button>
      </div>

      {loading && sessions.length === 0 ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={48} />}
          title="No play sessions yet"
          description="Log what you played and for how long — your gaming diary starts here."
        />
      ) : (
        dayGroups.map((group) => (
          <div key={group.key} className={styles.dayGroup}>
            <div className={styles.dayHeader}>
              <span className={styles.dayLabel}>{group.label}</span>
              <span className={styles.dayTotal}>{formatMinutes(group.total)}</span>
            </div>
            {group.sessions.map((session) => (
              <div key={session.id} className={styles.sessionRow}>
                {session.game.coverUrl ? (
                  <AppImage
                    src={session.game.coverUrl}
                    alt={session.game.title}
                    width={40}
                    height={54}
                    className={styles.sessionCover}
                  />
                ) : (
                  <div className={styles.sessionCover} />
                )}
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionTitle}>{session.game.title}</div>
                  <div className={styles.sessionMeta}>
                    {session.game.platform?.name}
                    {session.notes ? ` · ${session.notes}` : ""}
                  </div>
                </div>
                <span className={styles.sessionMinutes}>{formatMinutes(session.minutes)}</span>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(session.id)}
                  aria-label="Delete session"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
