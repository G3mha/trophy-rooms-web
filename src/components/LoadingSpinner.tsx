import { cn } from "@/lib/utils";
import styles from "./LoadingSpinner.module.css";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn(styles.container, className)}>
      <div className={styles.spinnerShell}>
        <div className={`${styles.spinner} ${styles[size]}`} />
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}
