"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import styles from "./SummaryStats.module.css";

type SummaryStatItem = {
  label: React.ReactNode;
  value: React.ReactNode;
  text: React.ReactNode;
};

type SummaryStatsProps = {
  items: SummaryStatItem[];
  className?: string;
};

function SummaryStats({ items, className }: SummaryStatsProps) {
  return (
    <section className={cn(styles.grid, className)}>
      {items.map((item, index) => (
        <div key={index} className={styles.card}>
          <span className={styles.label}>{item.label}</span>
          <strong className={styles.value}>{item.value}</strong>
          <p className={styles.text}>{item.text}</p>
        </div>
      ))}
    </section>
  );
}

export { SummaryStats, type SummaryStatItem };
