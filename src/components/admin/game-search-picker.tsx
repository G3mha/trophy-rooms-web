"use client";

import { useQuery } from "@apollo/client";
import { ChevronDown, ChevronRight, Search, X, Gamepad2 } from "lucide-react";
import * as React from "react";

import { GET_GAMES_ADMIN } from "@/graphql/admin_queries";
import { cn } from "@/lib/utils";
import { AdminImage } from "./admin-image";

const GAME_TYPE_LABELS: Record<string, string> = {
  BASE_GAME: "Base Game",
  FANGAME: "Fangame",
  ROM_HACK: "ROM Hack",
  MOD: "Mod",
  DLC: "DLC",
  EXPANSION: "Expansion",
};

export interface SearchableGame {
  id: string;
  gameFamilyId?: string;
  title: string;
  type?: string | null;
  coverUrl?: string | null;
  platform?: { id: string; name: string; slug: string } | null;
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

  const selectedSingle = React.useMemo(
    () => (props.mode === "single" ? props.value : null),
    [props.mode, props.value]
  );
  const selectedMultiple = React.useMemo(
    () => (props.mode === "multiple" ? props.value : []),
    [props.mode, props.value]
  );

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
      first: 200,
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

  const results: SearchableGame[] = React.useMemo(
    () =>
      data?.games?.edges?.map((edge: { node: SearchableGame }) => edge.node) ||
      [],
    [data]
  );

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

  const selectedIds = React.useMemo(
    () =>
      props.mode === "multiple"
        ? new Set(props.value.map((game) => game.id))
        : new Set(props.value ? [props.value.id] : []),
    [props.mode, props.value]
  );

  // Filter and sort results - prioritize exact/starts-with matches
  const options = React.useMemo(() => {
    const filtered = results
      .filter((game) => !excludeIds.includes(game.id))
      .filter((game) => (filterOption ? filterOption(game) : true))
      .filter((game) =>
        props.mode === "multiple" ? !selectedIds.has(game.id) : true
      );

    // If there's a search term, sort to prioritize better matches
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return filtered.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();

        // Exact match first
        const aExact = aTitle === searchLower;
        const bExact = bTitle === searchLower;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;

        // Starts with search term
        const aStarts = aTitle.startsWith(searchLower);
        const bStarts = bTitle.startsWith(searchLower);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;

        // Contains search term (earlier position is better)
        const aIndex = aTitle.indexOf(searchLower);
        const bIndex = bTitle.indexOf(searchLower);
        if (aIndex !== bIndex) return aIndex - bIndex;

        // Alphabetical fallback
        return aTitle.localeCompare(bTitle);
      });
    }

    return filtered;
  }, [results, excludeIds, filterOption, selectedIds, props.mode, debouncedSearch]);

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
      // Keep dropdown open in multi-select mode for easy multiple selections
      setSearch("");
      setDebouncedSearch("");
    } else {
      props.onChange(game);
      setSearch("");
      setDebouncedSearch("");
      setIsOpen(false);
    }
  };

  const clearSingle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (props.mode === "single") {
      props.onChange(null);
      setSearch("");
    }
  };

  const removeMultipleByTitle = (title: string) => {
    if (props.mode === "multiple") {
      props.onChange(props.value.filter((game) => game.title !== title));
    }
  };

  // Group selected games by title for display
  const groupedSelectedGames = React.useMemo(() => {
    if (props.mode !== "multiple") return [];

    const groups: Map<string, SearchableGame[]> = new Map();

    for (const game of selectedMultiple) {
      if (!groups.has(game.title)) {
        groups.set(game.title, []);
      }
      groups.get(game.title)!.push(game);
    }

    return Array.from(groups.entries()).map(([title, games]) => ({
      title,
      games,
    }));
  }, [props.mode, selectedMultiple]);

  return (
    <div ref={containerRef} className="space-y-2">
      {props.mode === "multiple" && groupedSelectedGames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groupedSelectedGames.map((group) => (
            <span
              key={group.title}
              className="inline-flex items-center gap-2 rounded-[var(--border-radius)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01)),var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
            >
              <span className="inline-flex items-center gap-1">
                {group.games.map((game) =>
                  game.platform?.slug ? (
                    <AdminImage
                      key={game.id}
                      src={`/platforms/${game.platform.slug}.svg`}
                      alt={game.platform.name || ""}
                      title={game.platform.name || ""}
                      className="size-4 shrink-0"
                    />
                  ) : null
                )}
              </span>
              <span className="max-w-[240px] truncate">{group.title}</span>
              <button
                type="button"
                onClick={() => removeMultipleByTitle(group.title)}
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                aria-label={`Remove ${group.title} (${group.games.length} platform${group.games.length > 1 ? "s" : ""})`}
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
            "flex min-h-11 w-full items-center gap-3 rounded-[var(--border-radius)] border border-[color:rgba(255,255,255,0.09)] bg-[rgba(10,10,10,0.55)] px-4 py-2.5 text-[15px] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-[border-color,box-shadow,background-color]",
            !disabled && "cursor-text",
            isOpen &&
              "border-[var(--nintendo-red)] bg-[rgba(18,18,18,0.9)] shadow-[0_0_0_3px_rgba(230,0,18,0.18)]",
            !disabled && !isOpen && "hover:border-[color:rgba(255,255,255,0.16)]",
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
                  <AdminImage
                    src={`/platforms/${selectedSingle.platform.slug}.svg`}
                    alt=""
                    className="size-4 shrink-0"
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
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[rgba(255,255,255,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {game.platform?.slug && (
                  <AdminImage
                    src={`/platforms/${game.platform.slug}.svg`}
                    alt=""
                    className="size-3.5"
                  />
                )}
                <span>{game.platform?.name || "Unknown"}</span>
              </button>
            ))}
          </div>
        )}

        {isOpen && (
          <div className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-[calc(var(--border-radius)+4px)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01)),var(--bg-card)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
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
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                      onClick={() => handleSelect(game)}
                    >
                      {game.coverUrl ? (
                        <AdminImage
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
                            <AdminImage
                              src={`/platforms/${game.platform.slug}.svg`}
                              alt=""
                              className="size-3.5"
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
                      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                      onClick={(e) => toggleGameCollapse(group.title, e)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)]" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-[var(--text-muted)]" />
                      )}
                      {group.coverUrl ? (
                        <AdminImage
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
                            className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                            onClick={() => handleSelect(game)}
                          >
                            {game.platform?.slug ? (
                              <AdminImage
                                src={`/platforms/${game.platform.slug}.svg`}
                                alt=""
                                className="size-4 shrink-0"
                                fallback={
                                  <Gamepad2 className="size-4 shrink-0 text-[var(--text-muted)]" />
                                }
                              />
                            ) : (
                              <Gamepad2 className="size-4 shrink-0 text-[var(--text-muted)]" />
                            )}
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
