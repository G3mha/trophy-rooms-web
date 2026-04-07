"use client";

import { type ComponentType } from "react";
import styles from "./FilterTabs.module.css";

type IconComponent = ComponentType<{ size?: number; className?: string }>;

export interface FilterTab<T extends string> {
  label: string;
  value: T;
  icon?: IconComponent;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Size of icons in pixels. Default: 16 */
  iconSize?: number;
  /** Additional CSS class for the container */
  className?: string;
}

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  iconSize = 16,
  className,
}: FilterTabsProps<T>) {
  return (
    <div className={`${styles.tabs} ${className || ""}`}>
      {tabs.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            onClick={() => onChange(tab.value)}
            aria-pressed={isActive}
          >
            {TabIcon && (
              <span className={styles.tabIcon}>
                <TabIcon size={iconSize} />
              </span>
            )}
            <span className={styles.tabLabel}>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={styles.tabCount}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
