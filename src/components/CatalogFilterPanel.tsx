"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import styles from "./CatalogFilterPanel.module.css";

type CatalogFilterPanelProps = {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  clearLabel?: string;
  onClear?: () => void;
  showClear?: boolean;
};

function CatalogFilterPanel({
  children,
  className,
  bodyClassName,
  clearLabel = "Clear Filters",
  onClear,
  showClear = false,
}: CatalogFilterPanelProps) {
  return (
    <section className={cn(styles.panel, className)} aria-label="Filters">
      <div className={cn(styles.body, bodyClassName)}>{children}</div>
      {showClear && onClear ? (
        <button type="button" onClick={onClear} className={styles.clearButton}>
          {clearLabel}
        </button>
      ) : null}
    </section>
  );
}

type CatalogFilterRowProps = React.ComponentProps<"div">;

function CatalogFilterRow({ className, ...props }: CatalogFilterRowProps) {
  return <div className={cn(styles.row, className)} {...props} />;
}

type CatalogSearchFieldProps = Omit<React.ComponentProps<"input">, "type"> & {
  className?: string;
  inputClassName?: string;
};

function CatalogSearchField({
  className,
  inputClassName,
  ...props
}: CatalogSearchFieldProps) {
  return (
    <label className={cn(styles.searchWrap, className)}>
      <Search size={16} className={styles.searchIcon} />
      <input type="text" className={cn(styles.searchInput, inputClassName)} {...props} />
    </label>
  );
}

type CatalogSelectFieldProps = React.ComponentProps<"select"> & {
  className?: string;
  selectClassName?: string;
};

function CatalogSelectField({
  className,
  selectClassName,
  children,
  ...props
}: CatalogSelectFieldProps) {
  return (
    <div className={cn(styles.selectWrap, className)}>
      <select className={cn(styles.select, selectClassName)} {...props}>
        {children}
      </select>
      <ChevronDown className={styles.selectIcon} size={16} />
    </div>
  );
}

export {
  CatalogFilterPanel,
  CatalogFilterRow,
  CatalogSearchField,
  CatalogSelectField,
};
