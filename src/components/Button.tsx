import Link from "next/link";
import styles from "./Button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "neon";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  disabled = false,
  loading = false,
  type = "button",
  className = "",
}: ButtonProps) {
  const classNames = `${styles.button} ${styles[variant]} ${styles[size]} ${
    loading ? styles.loading : ""
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={classNames}>
        {loading ? <span className={styles.spinner} /> : children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
