"use client";

import { useQuery } from "@apollo/client";
import { ChevronDown, ChevronRight, Search, X, Gamepad2 } from "lucide-react";
import * as React from "react";

import { GET_GAMES_ADMIN } from "@/graphql/admin_queries";
import { cn } from "@/lib/utils";

const GAME_TYPE_LABELS: Record<string, string> = {
  BASE_GAME: "Base Game",
  FANGAME: "Fangame",
  ROM_HACK: "ROM Hack",
  DLC: "DLC",
  EXPANSION: "Expansion",
};

export interface SearchableGame {
  id: string;
  title: string;
  type?: string | null;
  coverUrl?: string | null;
  platform?: { name: string; slug: string } | null;
}

interface GameGroup {
  title: string;
  coverUrl: string | null;
  games: SearchableGame[];
}

type SharedPickerProps = {
  disabled?: boolean;
  emptyText?: string;
  excludeIds?: string[];
  filterOption?: (game: SearchableGame) => boolean;
  placeholder?: string;
};

type SinglePickerProps = SharedPickerProps & {
  mode: "single";
  value: SearchableGame | null;
  onChange: (value: SearchableGame | null) => void;
};

type MultiplePickerProps = SharedPickerProps & {
  mode: "multiple";
  value: SearchableGame[];
  onChange: (value: SearchableGame[]) => void;
};

type GameSearchPickerProps = SinglePickerProps | MultiplePickerProps;

export function GameSearchPicker(props: GameSearchPickerProps) {
  const {
    disabled = false,
    emptyText = "No games found.",
    excludeIds = [],
    filterOption,
    placeholder = "Search games...",
  } = props;

  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [collapsedGames, setCollapsedGames] = React.useState<Set<string>>(new Set());
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedSingle = props.mode === "single" ? props.value : null;
  const selectedMultiple = props.mode === "multiple" ? props.value : [];

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
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

  // Main search query
  const { data, loading } = useQuery(GET_GAMES_ADMIN, {
    variables: {
      first: 50,
      orderBy: "TITLE_ASC",
      search: debouncedSearch || undefined,
    },
    notifyOnNetworkStatusChange: true,
  });

  // Query for sibling platforms (games with same title as selected)
  const { data: siblingsData } = useQuery(GET_GAMES_ADMIN, {
    variables: {
      first: 20,
      orderBy: "TITLE_ASC",
      search: selectedSingle?.title || undefined,
    },
    skip: !selectedSingle || props.mode !== "single",
  });

  const results: SearchableGame[] =
    data?.games?.edges?.map((edge: { node: SearchableGame }) => edge.node) || [];

  // Get sibling games (same title, different platforms)
  const siblingGames = React.useMemo(() => {
    if (!selectedSingle || !siblingsData?.games?.edges) return [];

    const allSiblings: SearchableGame[] = siblingsData.games.edges
      .map((edge: { node: SearchableGame }) => edge.node)
      .filter((game: SearchableGame) => game.title === selectedSingle.title)
      .filter((game: SearchableGame) => filterOption ? filterOption(game) : true)
      .filter((game: SearchableGame) => game.id !== selectedSingle.id);

    // Sort alphabetically by platform name
    return allSiblings.sort((a: SearchableGame, b: SearchableGame) =>
      (a.platform?.name || "").localeCompare(b.platform?.name || "")
    );
  }, [selectedSingle, siblingsData, filterOption]);

  const selectedIds =
    props.mode === "multiple"
      ? new Set(props.value.map((game) => game.id))
      : new Set(props.value ? [props.value.id] : []);

  const options = results
    .filter((game) => !excludeIds.includes(game.id))
    .filter((game) => (filterOption ? filterOption(game) : true))
    .filter((game) =>
      props.mode === "multiple" ? !selectedIds.has(game.id) : true
    );

  // Group games by title
  const groupedByTitle = React.useMemo(() => {
    const groups: Map<string, GameGroup> = new Map();

    for (const game of options) {
      const titleKey = game.title;

      if (!groups.has(titleKey)) {
        groups.set(titleKey, {
          title: titleKey,
          coverUrl: game.coverUrl || null,
          games: [],
        });
      }

      groups.get(titleKey)!.games.push(game);
    }

    // Sort platforms within each group alphabetically
    for (const group of groups.values()) {
      group.games.sort((a, b) =>
        (a.platform?.name || "").localeCompare(b.platform?.name || "")
      );
    }

    // Return groups sorted by title
    return Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [options]);

  const toggleGameCollapse = (title: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCollapsedGames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const handleSelect = (game: SearchableGame) => {
    if (props.mode === "multiple") {
      props.onChange([...props.value, game]);
    } else {
      props.onChange(game);
    }

    setSearch("");
    setDebouncedSearch("");
    setIsOpen(false);
  };

  const clearSingle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (props.mode === "single") {
      props.onChange(null);
      setSearch("");
    }
  };

  const removeMultiple = (id: string) => {
    if (props.mode === "multiple") {
      props.onChange(props.value.filter((game) => game.id !== id));
    }
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {props.mode === "multiple" && selectedMultiple.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMultiple.map((game) => (
            <span
              key={game.id}
              className="inline-flex items-center gap-2 rounded-[var(--border-radius)] border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
            >
              <span className="max-w-[240px] truncate">{game.title}</span>
              <button
                type="button"
                onClick={() => removeMultiple(game.id)}
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                aria-label={`Remove ${game.title}`}
              >
                <X className="size-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div
          className={cn(
            "flex min-h-12 w-full items-center gap-2 rounded-[var(--border-radius)] border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-base text-[var(--text-primary)] transition-colors",
            !disabled && "cursor-text",
            isOpen &&
              "border-[var(--nintendo-red)] shadow-[inset_0_0_0_1px_var(--nintendo-red)]",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={() => {
            if (disabled) return;
            setIsOpen(true);
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <Search className="size-4 shrink-0 text-[var(--text-muted)]" />
          {props.mode === "single" && !isOpen ? (
            selectedSingle ? (
              <div className="flex flex-1 items-center gap-2 truncate">
                {selectedSingle.platform?.slug && (
                  <img
                    src={`/platforms/${selectedSingle.platform.slug}.svg`}
                    alt=""
                    className="size-4 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span className="truncate">
                  {selectedSingle.title}
                  {selectedSingle.platform?.name && (
                    <span className="text-[var(--text-muted)]">
                      {" "}• {selectedSingle.platform.name}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="flex-1 truncate text-[var(--text-muted)]">
                {placeholder}
              </span>
            )
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setIsOpen(true)}
              onClick={(event) => event.stopPropagation()}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none placeholder:text-[var(--text-muted)]"
            />
          )}

          {props.mode === "single" && selectedSingle && !isOpen ? (
            <button
              type="button"
              onClick={clearSingle}
              className="shrink-0 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              aria-label={`Clear ${selectedSingle.title}`}
            >
              <X className="size-4" />
            </button>
          ) : (
            <ChevronDown className="size-4 shrink-0 text-[var(--text-muted)]" />
          )}
        </div>

        {/* Platform Switcher - shown when a game is selected and has siblings */}
        {props.mode === "single" && selectedSingle && siblingGames.length > 0 && !isOpen && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Switch platform:</span>
            {siblingGames.map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => handleSelect(game)}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1 text-xs text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {game.platform?.slug && (
                  <img
                    src={`/platforms/${game.platform.slug}.svg`}
                    alt=""
                    className="size-3.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span>{game.platform?.name || "Unknown"}</span>
              </button>
            ))}
          </div>
        )}

        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-[var(--border-radius)] border border-[var(--border-color)] bg-[var(--bg-card)] p-1 shadow-lg">
            {loading ? (
              <div className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                Searching games...
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                {emptyText}
              </div>
            ) : (
              groupedByTitle.map((group) => {
                const isCollapsed = collapsedGames.has(group.title);
                const hasMultiplePlatforms = group.games.length > 1;

                // If only one platform, render as a simple selectable item
                if (!hasMultiplePlatforms) {
                  const game = group.games[0];
                  return (
                    <button
                      key={game.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-card-hover)]"
                      onClick={() => handleSelect(game)}
                    >
                      {game.coverUrl ? (
                        <img
                          src={game.coverUrl}
                          alt=""
                          className="size-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-[var(--bg-secondary)]">
                          <Gamepad2 className="size-5 text-[var(--text-muted)]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {game.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          {game.platform?.slug && (
                            <img
                              src={`/platforms/${game.platform.slug}.svg`}
                              alt=""
                              className="size-3.5"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span>
                            {[
                              game.platform?.name,
                              game.type && game.type !== "BASE_GAME"
                                ? GAME_TYPE_LABELS[game.type] || game.type
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                }

                // Multiple platforms - render as collapsible group
                return (
                  <div key={group.title} className="mb-1">
                    {/* Game Title Header */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-secondary)]"
                      onClick={(e) => toggleGameCollapse(group.title, e)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)]" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-[var(--text-muted)]" />
                      )}
                      {group.coverUrl ? (
                        <img
                          src={group.coverUrl}
                          alt=""
                          className="size-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex size-10 shrink-0 items-center justify-center rounded bg-[var(--bg-secondary)]">
                          <Gamepad2 className="size-5 text-[var(--text-muted)]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {group.title}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {group.games.length} platforms
                        </div>
                      </div>
                    </button>

                    {/* Platform Options */}
                    {!isCollapsed && (
                      <div className="ml-6 border-l border-[var(--border-color)] pl-3">
                        {group.games.map((game) => (
                          <button
                            key={game.id}
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-card-hover)]"
                            onClick={() => handleSelect(game)}
                          >
                            {game.platform?.slug ? (
                              <img
                                src={`/platforms/${game.platform.slug}.svg`}
                                alt=""
                                className="size-4 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                  if (fallback) fallback.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Gamepad2 className={cn(
                              "size-4 shrink-0 text-[var(--text-muted)]",
                              game.platform?.slug && "hidden"
                            )} />
                            <span className="flex-1 truncate text-sm text-[var(--text-primary)]">
                              {game.platform?.name || "Unknown Platform"}
                            </span>
                            {game.type && game.type !== "BASE_GAME" && (
                              <span className="text-xs text-[var(--text-muted)]">
                                {GAME_TYPE_LABELS[game.type] || game.type}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
