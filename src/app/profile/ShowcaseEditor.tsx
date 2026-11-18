"use client";

import { ArrowDown, ArrowUp, Gamepad2, X } from "lucide-react";
import { AppImage, Button } from "@/components";
import { GameFamilySearchPicker } from "@/components/admin";
import { GameCombobox } from "@/components/ui/game-combobox";
import { SHOWCASE_MAX_GAMES, type ShowcaseGame } from "@/lib/profile";
import styles from "./page.module.css";

interface ShowcaseEditorProps {
  title: string;
  games: ShowcaseGame[];
  onChange: (games: ShowcaseGame[]) => void;
  /** Games the list may hold. Undefined means any game, found by search. */
  candidates?: ShowcaseGame[];
  emptyCandidatesText?: string;
  disabled?: boolean;
}

export function ShowcaseEditor({
  title,
  games,
  onChange,
  candidates,
  emptyCandidatesText,
  disabled = false,
}: ShowcaseEditorProps) {
  const full = games.length >= SHOWCASE_MAX_GAMES;
  const pickedIds = games.map((game) => game.id);

  const add = (game: ShowcaseGame | null | undefined) => {
    if (game && !full && !pickedIds.includes(game.id)) onChange([...games, game]);
  };
  const move = (from: number, to: number) => {
    const next = [...games];
    const [game] = next.splice(from, 1);
    next.splice(to, 0, game!);
    onChange(next);
  };

  return (
    <section className={styles.showcase} aria-label={title}>
      <div className={styles.showcaseHeader}>
        <h2 className={styles.groupTitle}>{title}</h2>
        <span className={styles.counter}>
          {games.length}/{SHOWCASE_MAX_GAMES}
        </span>
      </div>

      {games.length > 0 && (
        <ol className={styles.showcaseList}>
          {games.map((game, index) => (
            <li key={game.id} className={styles.showcaseRow}>
              <span className={styles.rank}>{index + 1}</span>
              <span className={styles.thumb}>
                <AppImage src={game.coverUrl} alt="" fallback={<Gamepad2 size={18} aria-hidden />} />
              </span>
              <span className={styles.showcaseTitle}>{game.title}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${game.title} up`}
                disabled={disabled || index === 0}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${game.title} down`}
                disabled={disabled || index === games.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${game.title}`}
                disabled={disabled}
                onClick={() => onChange(games.filter((g) => g.id !== game.id))}
              >
                <X size={16} />
              </Button>
            </li>
          ))}
        </ol>
      )}

      {full ? null : candidates === undefined ? (
        <GameFamilySearchPicker
          value={null}
          onChange={(family) => add(family)}
          disabled={disabled}
          placeholder="Add a game..."
          filterOption={(family) => !pickedIds.includes(family.id)}
        />
      ) : candidates.length === 0 ? (
        <p className={styles.hint}>{emptyCandidatesText}</p>
      ) : (
        <GameCombobox
          games={candidates}
          value=""
          onChange={(id) => add(candidates.find((game) => game.id === id))}
          excludeIds={pickedIds}
          disabled={disabled}
          placeholder="Add a game..."
        />
      )}
    </section>
  );
}
