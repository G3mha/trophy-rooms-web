"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function SSOCallbackPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.logo}>🏆</span>
        <div className={styles.spinner} />
        <p className={styles.text}>Completing sign in...</p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
