import { Skeleton } from "./Skeleton";
import styles from "./PageSkeleton.module.css";

type PageSkeletonProps = {
  // covers: game cover grid; cards: wide cards with a cover banner on top;
  // rows: stacked list or table rows; detail: one game, bundle or profile
  variant: "covers" | "cards" | "rows" | "detail";
  label?: string;
  // Off when the page already shows its own heading while loading
  header?: boolean;
  count?: number;
  // The page's own grid class, so skeleton columns follow its breakpoints
  gridClassName?: string;
};

const DEFAULT_COUNT = { covers: 12, cards: 6, rows: 8, detail: 4 };

function Row() {
  return (
    <div className={styles.row}>
      <Skeleton className={styles.avatar} />
      <div className={styles.lines}>
        <Skeleton className={styles.line} />
        <Skeleton className={styles.lineShort} />
      </div>
      <Skeleton className={styles.rowEnd} />
    </div>
  );
}

export function PageSkeleton({
  variant,
  label = "Loading",
  // A detail page's title sits beside its cover, not above it
  header = variant !== "detail",
  count = DEFAULT_COUNT[variant],
  gridClassName,
}: PageSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={styles.page} role="status" aria-label={label}>
      {header && (
        <div className={styles.header}>
          <Skeleton className={styles.heading} />
          <Skeleton className={styles.subheading} />
        </div>
      )}

      {variant === "covers" && (
        <div className={gridClassName ?? styles.covers}>
          {items.map((i) => (
            <div key={i} className={styles.coverCard}>
              <Skeleton className={styles.cover} />
              <div className={styles.cardBody}>
                <Skeleton className={styles.line} />
                <Skeleton className={styles.lineShort} />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "cards" && (
        <div className={gridClassName ?? styles.cards}>
          {items.map((i) => (
            <div key={i} className={styles.card}>
              <Skeleton className={styles.banner} />
              <div className={styles.cardBody}>
                <Skeleton className={styles.line} />
                <Skeleton className={styles.lineShort} />
                <Skeleton className={styles.lineShort} />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === "rows" && (
        <div className={styles.rows}>
          {items.map((i) => (
            <Row key={i} />
          ))}
        </div>
      )}

      {variant === "detail" && (
        <>
          <div className={styles.detail}>
            <Skeleton className={styles.detailCover} />
            <div className={styles.detailInfo}>
              <Skeleton className={styles.heading} />
              <Skeleton className={styles.line} />
              <Skeleton className={styles.line} />
              <Skeleton className={styles.lineShort} />
              <Skeleton className={styles.button} />
            </div>
          </div>
          <div className={styles.rows}>
            {items.map((i) => (
              <Row key={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
