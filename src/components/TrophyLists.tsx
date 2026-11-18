"use client";

import type { ReactNode } from "react";
import { ChevronRight, Eye, EyeOff } from "lucide-react";
import { FilterTabs, type FilterTab } from "./FilterTabs";
import type { AchievementTier } from "./AchievementCard";
import styles from "./TrophyLists.module.css";

// What the trophy lists need to know about a trophy
interface Trophy {
  id: string;
  tier?: AchievementTier;
  isCompleted?: boolean;
}

export type TrophyFilter = "all" | "left" | "earned";

const FILTER_TABS: FilterTab<TrophyFilter>[] = [
  { label: "All", value: "all" },
  { label: "Not earned", value: "left" },
  { label: "Earned", value: "earned" },
];

export const showsUnderFilter = (filter: TrophyFilter, trophy: Trophy) =>
  filter === "all" || (filter === "earned") === Boolean(trophy.isCompleted);

// The backend awards the Platinum, so progress counts never include it
export const notPlatinum = (trophy: Trophy) => trophy.tier !== "PLATINUM";

const TIER_RANK: Record<AchievementTier, number> = { PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1 };

// Best tier first
export function sortByTier<T extends Trophy>(trophies: T[]): T[] {
  return [...trophies].sort((a, b) => TIER_RANK[b.tier ?? "BRONZE"] - TIER_RANK[a.tier ?? "BRONZE"]);
}

// Two columns once a row can be 400px wide
export function TrophyGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}

export function FilterEmpty({ filter }: { filter: TrophyFilter }) {
  return <p className={styles.empty}>{filter === "earned" ? "Nothing earned yet." : "All earned."}</p>;
}

interface TrophyToolbarProps {
  // Only a signed-in player has anything earned to filter by
  showFilter: boolean;
  filter: TrophyFilter;
  onFilterChange: (filter: TrophyFilter) => void;
  // Only when some trophy has a description to reveal
  showReveal: boolean;
  revealAll: boolean;
  onRevealAllChange: (revealAll: boolean) => void;
}

export function TrophyToolbar({
  showFilter,
  filter,
  onFilterChange,
  showReveal,
  revealAll,
  onRevealAllChange,
}: TrophyToolbarProps) {
  if (!showFilter && !showReveal) return null;
  return (
    <div className={styles.toolbar}>
      {showFilter && (
        <FilterTabs tabs={FILTER_TABS} value={filter} onChange={onFilterChange} className={styles.filterTabs} />
      )}
      {showReveal && (
        <button type="button" className={styles.revealAll} onClick={() => onRevealAllChange(!revealAll)}>
          {revealAll ? <EyeOff size={16} /> : <Eye size={16} />}
          {revealAll ? "Hide descriptions" : "Show descriptions"}
        </button>
      )}
    </div>
  );
}

interface TrophySetProps<T extends Trophy> {
  title: string;
  achievements: T[];
  filter: TrophyFilter;
  isSignedIn: boolean;
  defaultOpen?: boolean;
  renderAchievement: (achievement: T) => ReactNode;
}

// One trophy list, folded behind its name and count
export function TrophySet<T extends Trophy>({
  title,
  achievements,
  filter,
  isSignedIn,
  defaultOpen = false,
  renderAchievement,
}: TrophySetProps<T>) {
  const counted = achievements.filter(notPlatinum);
  const visible = sortByTier(achievements).filter((a) => showsUnderFilter(filter, a));
  return (
    <details className={styles.set} open={defaultOpen}>
      <summary className={styles.summary}>
        <ChevronRight size={18} className={styles.chevron} aria-hidden />
        <span className={styles.name}>{title}</span>
        <span className={styles.count}>
          {isSignedIn
            ? `${counted.filter((a) => a.isCompleted).length} of ${counted.length}`
            : `${counted.length} ${counted.length === 1 ? "trophy" : "trophies"}`}
        </span>
      </summary>
      <div className={styles.setBody}>
        {visible.length > 0 ? (
          <TrophyGrid>{visible.map(renderAchievement)}</TrophyGrid>
        ) : achievements.length > 0 ? (
          <FilterEmpty filter={filter} />
        ) : (
          <p className={styles.empty}>No trophies in this list yet.</p>
        )}
      </div>
    </details>
  );
}
