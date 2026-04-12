"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "./input";
import { SelectableButton } from "./selectable-button";

interface Platform {
  id: string;
  name: string;
}

// Platform groupings by manufacturer
const PLATFORM_GROUPS: Record<string, string[]> = {
  Nintendo: [
    "switch", "wii-u", "wii", "3ds", "ds", "gba", "gbc", "gb", "nes", "snes",
    "n64", "gamecube", "virtualboy"
  ],
  Sony: [
    "ps5", "ps4", "ps3", "ps2", "ps1", "psp", "vita", "playstation"
  ],
  Microsoft: [
    "xbox-series", "xbox-one", "xbox-360", "xbox", "windows", "pc"
  ],
  Sega: [
    "dreamcast", "saturn", "genesis", "mega-drive", "game-gear", "master-system"
  ],
  Atari: [
    "atari", "2600", "7800", "jaguar", "lynx"
  ],
};

function getPlatformGroup(slug: string): string {
  const lowerSlug = slug.toLowerCase();
  for (const [group, keywords] of Object.entries(PLATFORM_GROUPS)) {
    if (keywords.some(kw => lowerSlug.includes(kw))) {
      return group;
    }
  }
  return "Other";
}

interface PlatformPickerProps {
  platforms: Platform[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  /** IDs to exclude from selection (e.g., current platform) */
  excludeIds?: string[];
  /** Show search input when platforms exceed this count */
  searchThreshold?: number;
  /** Group platforms by manufacturer */
  grouped?: boolean;
  /** Max height for the list */
  maxHeight?: string;
  /** Placeholder text for search */
  searchPlaceholder?: string;
}

export function PlatformPicker({
  platforms,
  selectedIds,
  onToggle,
  excludeIds = [],
  searchThreshold = 6,
  grouped = false,
  maxHeight = "200px",
  searchPlaceholder = "Search platforms...",
}: PlatformPickerProps) {
  const [search, setSearch] = useState("");

  // Filter out excluded platforms
  const availablePlatforms = useMemo(() => {
    return platforms.filter(p => !excludeIds.includes(p.id));
  }, [platforms, excludeIds]);

  // Filter by search
  const filteredPlatforms = useMemo(() => {
    if (!search.trim()) return availablePlatforms;
    const query = search.toLowerCase();
    return availablePlatforms.filter(p =>
      p.name.toLowerCase().includes(query)
    );
  }, [availablePlatforms, search]);

  // Group platforms if enabled
  const groupedPlatforms = useMemo(() => {
    if (!grouped) return { "": filteredPlatforms };

    const groups: Record<string, Platform[]> = {};
    for (const platform of filteredPlatforms) {
      const group = getPlatformGroup(platform.name);
      if (!groups[group]) groups[group] = [];
      groups[group].push(platform);
    }

    // Sort groups: Nintendo, Sony, Microsoft, Sega, Atari, Other
    const sortOrder = ["Nintendo", "Sony", "Microsoft", "Sega", "Atari", "Other"];
    const sorted: Record<string, Platform[]> = {};
    for (const group of sortOrder) {
      if (groups[group]?.length) {
        sorted[group] = groups[group];
      }
    }
    // Add any remaining groups
    for (const [group, platforms] of Object.entries(groups)) {
      if (!sorted[group]) {
        sorted[group] = platforms;
      }
    }
    return sorted;
  }, [filteredPlatforms, grouped]);

  const showSearch = availablePlatforms.length >= searchThreshold;

  return (
    <div className="flex flex-col gap-3">
      {showSearch && (
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div
        className="flex flex-col gap-1.5 overflow-y-auto"
        style={{ maxHeight }}
      >
        {Object.entries(groupedPlatforms).map(([group, platforms]) => (
          <div key={group || "all"}>
            {grouped && group && (
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 mt-2 first:mt-0">
                {group}
              </div>
            )}
            {platforms.map((platform) => (
              <SelectableButton
                key={platform.id}
                selected={selectedIds.has(platform.id)}
                onClick={() => onToggle(platform.id)}
              >
                {platform.name}
              </SelectableButton>
            ))}
          </div>
        ))}

        {filteredPlatforms.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">
            {search ? `No platforms matching "${search}"` : "No platforms available"}
          </div>
        )}
      </div>
    </div>
  );
}
