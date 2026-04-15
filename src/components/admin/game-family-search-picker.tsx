"use client";

import { useQuery } from "@apollo/client";
import { Search, X, Gamepad2 } from "lucide-react";
import * as React from "react";

import { GET_GAME_FAMILIES } from "@/graphql/admin_queries";
import { cn } from "@/lib/utils";

const GAME_TYPE_LABELS: Record<string, string> = {
  BASE_GAME: "Base Game",
  FANGAME: "Fangame",
  ROM_HACK: "ROM Hack",
  MOD: "Mod",
  DLC: "DLC",
  EXPANSION: "Expansion",
};

export interface SearchableGameFamily {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  coverUrl?: string | null;
  type?: string | null;
  platforms?: { id: string; name: string; slug: string }[];
  achievementSetCount?: number;
  gameCount?: number;
}

interface GameFamilySearchPickerProps {
  value: SearchableGameFamily | null;
  onChange: (value: SearchableGameFamily | null) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyText?: string;
  filterOption?: (family: SearchableGameFamily) => boolean;
}

export function GameFamilySearchPicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Search game families...",
  emptyText = "No game families found.",
  filterOption,
}: GameFamilySearchPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
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

  const { data, loading } = useQuery(GET_GAME_FAMILIES, {
    variables: {
      page: 1,
      pageSize: 100,
      search: debouncedSearch || undefined,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results: SearchableGameFamily[] = data?.gameFamiliesPage?.items || [];

  const options = React.useMemo(() => {
    let filtered = results;

    if (filterOption) {
      filtered = filtered.filter(filterOption);
    }

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

        // Alphabetical fallback
        return aTitle.localeCompare(bTitle);
      });
    }

    return filtered;
  }, [results, filterOption, debouncedSearch]);

  const handleSelect = (family: SearchableGameFamily) => {
    onChange(family);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected value display / Search input */}
      <div
        className={cn(
          "flex items-center gap-2 w-full min-h-[42px] px-3 py-2",
          "bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg",
          "transition-all duration-150",
          isOpen && "border-[var(--nintendo-red)] ring-2 ring-[var(--nintendo-red)]/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />

        {value && !isOpen ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value.coverUrl ? (
              <img
                src={value.coverUrl}
                alt=""
                className="w-6 h-6 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-[var(--bg-primary)] flex items-center justify-center flex-shrink-0">
                <Gamepad2 size={14} className="text-[var(--text-muted)]" />
              </div>
            )}
            <span className="text-sm text-[var(--text-primary)] truncate">
              {value.title}
            </span>
            {value.type && value.type !== "BASE_GAME" && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)]">
                {GAME_TYPE_LABELS[value.type] || value.type}
              </span>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={value ? value.title : placeholder}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent border-none outline-none text-sm",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            )}
            onFocus={() => setIsOpen(true)}
          />
        )}

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 hover:bg-[var(--bg-primary)] rounded transition-colors"
          >
            <X size={14} className="text-[var(--text-muted)]" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full mt-1 py-1",
            "bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg",
            "shadow-lg max-h-[300px] overflow-y-auto"
          )}
        >
          {loading && options.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
              Loading...
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-[var(--text-muted)]">
              {emptyText}
            </div>
          ) : (
            options.map((family) => (
              <button
                key={family.id}
                type="button"
                onClick={() => handleSelect(family)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left",
                  "hover:bg-[var(--bg-secondary)] transition-colors",
                  value?.id === family.id && "bg-[var(--bg-secondary)]"
                )}
              >
                {family.coverUrl ? (
                  <img
                    src={family.coverUrl}
                    alt=""
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0">
                    <Gamepad2 size={18} className="text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {family.title}
                    </span>
                    {family.type && family.type !== "BASE_GAME" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)]">
                        {GAME_TYPE_LABELS[family.type] || family.type}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {family.platforms && family.platforms.length > 0
                      ? `${family.platforms.length} platform${family.platforms.length > 1 ? "s" : ""}`
                      : "No platforms"}
                    {family.achievementSetCount !== undefined && (
                      <> &middot; {family.achievementSetCount} achievement set{family.achievementSetCount !== 1 ? "s" : ""}</>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
