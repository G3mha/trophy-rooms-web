"use client";

import { AppleLogo } from "./BrandLogos";
import styles from "./AppleButton.module.css";

interface AppleButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export function AppleButton({
  onClick,
  loading = false,
  label = "Continue with Apple",
}: AppleButtonProps) {
  return (
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <AppleLogo className={styles.icon} />
      )}
      <span>{label}</span>
    </button>
  );
}
