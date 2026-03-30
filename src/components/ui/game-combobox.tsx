"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Game {
  id: string;
  title: string;
  platform?: { name: string } | null;
  coverUrl?: string | null;
}

interface GameComboboxProps {
  games: Game[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
}

export function GameCombobox({
  games,
  value,
  onChange,
  placeholder = "Search for a game...",
  disabled = false,
  excludeIds = [],
}: GameComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedGame = games.find((g) => g.id === value);

  const filteredGames = games
    .filter((g) => !excludeIds.includes(g.id))
    .filter(
      (g) =>
        search === "" ||
        g.title.toLowerCase().includes(search.toLowerCase())
    );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (gameId: string) => {
    onChange(gameId);
    setSearch("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex h-12 w-full items-center gap-2 rounded-[var(--border-radius)] border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-base text-[var(--text-primary)] transition-colors cursor-pointer",
          isOpen && "border-[var(--nintendo-red)] shadow-[inset_0_0_0_1px_var(--nintendo-red)]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <Search className="size-4 text-[var(--text-muted)] shrink-0" />
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none placeholder:text-[var(--text-muted)]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn(
              "flex-1 truncate",
              !selectedGame && "text-[var(--text-muted)]"
            )}
          >
            {selectedGame ? selectedGame.title : placeholder}
          </span>
        )}
        {selectedGame && !isOpen ? (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="size-4" />
          </button>
        ) : (
          <ChevronDown className="size-4 text-[var(--text-muted)] shrink-0" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-[var(--border-radius)] border border-[var(--border-color)] bg-[var(--bg-card)] p-1 shadow-lg">
          {filteredGames.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
              No games found
            </div>
          ) : (
            filteredGames.map((game) => (
              <div
                key={game.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors hover:bg-[var(--bg-card-hover)]",
                  game.id === value && "bg-[var(--bg-card-hover)]"
                )}
                onClick={() => handleSelect(game.id)}
              >
                {game.coverUrl && (
                  <img
                    src={game.coverUrl}
                    alt=""
                    className="size-8 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {game.title}
                  </div>
                  {game.platform?.name && (
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {game.platform.name}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
