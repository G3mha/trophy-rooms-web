import styles from "./AuthCard.module.css";

interface AuthCardProps {
  title: string;
  subtitle?: React.ReactNode;
  // Lines under the form. Links and buttons inside pick up the link style.
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// Shared frame for the sign-in and sign-up screens: one cabinet panel with
// the title inside it, standing on a lit shelf edge.
export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.body}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {children}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
        <div className={styles.shelf} />
      </div>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className={styles.divider}>
      <span>or</span>
    </div>
  );
}
