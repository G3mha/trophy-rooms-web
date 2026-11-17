"use client";

import { Roboto } from "next/font/google";

import { GoogleLogo } from "./BrandLogos";
import styles from "./GoogleButton.module.css";

const roboto = Roboto({ weight: "500", subsets: ["latin"] });

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export function GoogleButton({
  onClick,
  loading = false,
  label = "Continue with Google",
}: GoogleButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.button} ${roboto.className}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : (
        <GoogleLogo className={styles.icon} />
      )}
      <span>{label}</span>
    </button>
  );
}
