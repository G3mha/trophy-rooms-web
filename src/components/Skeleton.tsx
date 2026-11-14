import { cn } from "@/lib/utils";
import styles from "./Skeleton.module.css";

// A placeholder block shaped like the content it stands in for. Size it with
// a className; it is hidden from screen readers, so label the loading region.
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn(styles.skeleton, className)} aria-hidden="true" />;
}
