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

interface PlatformGroup {
  platformName: string;
  platformSlug: string | null;
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
  const [collapsedPlatforms, setCollapsedPlatforms] = React.useState<Set<string>>(new Set());
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const { data, loading } = useQuery(GET_GAMES_ADMIN, {
    variables: {
      first: 50,
      orderBy: "TITLE_ASC",
      search: debouncedSearch || undefined,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results: SearchableGame[] =
    data?.games?.edges?.map((edge: { node: SearchableGame }) => edge.node) || [];

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

  // Group games by platform
  const groupedByPlatform = React.useMemo(() => {
    const groups: Map<string, PlatformGroup> = new Map();

    for (const game of options) {
      const platformKey = game.platform?.name || "Unknown Platform";

      if (!groups.has(platformKey)) {
        groups.set(platformKey, {
          platformName: platformKey,
          platformSlug: game.platform?.slug || null,
          games: [],
        });
      }

      groups.get(platformKey)!.games.push(game);
    }

    // Sort groups alphabetically by platform name
    return Array.from(groups.values()).sort((a, b) =>
      a.platformName.localeCompare(b.platformName)
    );
  }, [options]);

  const togglePlatformCollapse = (platformName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setCollapsedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(platformName)) {
        newSet.delete(platformName);
      } else {
        newSet.add(platformName);
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

  const selectedSingle = props.mode === "single" ? props.value : null;
  const selectedMultiple = props.mode === "multiple" ? props.value : [];

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
            <span
              className={cn(
                "flex-1 truncate",
                !selectedSingle && "text-[var(--text-muted)]"
              )}
            >
              {selectedSingle ? selectedSingle.title : placeholder}
            </span>
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
              groupedByPlatform.map((group) => {
                const isCollapsed = collapsedPlatforms.has(group.platformName);

                return (
                  <div key={group.platformName} className="mb-1">
                    {/* Platform Header */}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-secondary)]"
                      onClick={(e) => togglePlatformCollapse(group.platformName, e)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)]" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-[var(--text-muted)]" />
                      )}
                      {group.platformSlug ? (
                        <img
                          src={`/platforms/${group.platformSlug}.svg`}
                          alt=""
                          className="size-4 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Gamepad2 className={cn("size-4 shrink-0 text-[var(--text-muted)]", group.platformSlug && "hidden")} />
                      <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {group.platformName}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {group.games.length}
                      </span>
                    </button>

                    {/* Games in Platform */}
                    {!isCollapsed && (
                      <div className="ml-2 border-l border-[var(--border-color)] pl-2">
                        {group.games.map((game) => (
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
                                className="size-8 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="size-8 shrink-0 rounded bg-[var(--bg-secondary)]" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                                {game.title}
                              </div>
                              {game.type && game.type !== "BASE_GAME" && (
                                <div className="truncate text-xs text-[var(--text-muted)]">
                                  {GAME_TYPE_LABELS[game.type] || game.type}
                                </div>
                              )}
                            </div>
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
