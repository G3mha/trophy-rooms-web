import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p className={styles.copyright}>
          &copy; {currentYear} Trophy Rooms. All rights reserved.
        </p>
        <nav className={styles.links}>
          <Link href="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={styles.link}>
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
