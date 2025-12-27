import styles from "./StatCard.module.css";

interface StatCardProps {
  value: number | string;
  label: string;
  icon?: string;
  variant?: "default" | "gold" | "red" | "blue";
}

export function StatCard({ value, label, icon, variant = "default" }: StatCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
