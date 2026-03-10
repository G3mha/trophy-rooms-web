"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import styles from "./EmailForm.module.css";

interface EmailFormProps {
  onSubmit: (email: string, password: string) => void;
  loading?: boolean;
  error?: string;
  submitLabel?: string;
  showPasswordRequirements?: boolean;
}

export function EmailForm({
  onSubmit,
  loading = false,
  error,
  submitLabel = "Continue",
  showPasswordRequirements = false,
}: EmailFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className={styles.input}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <div className={styles.passwordWrapper}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className={styles.input}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={showPasswordRequirements ? "new-password" : "current-password"}
            disabled={loading}
            minLength={showPasswordRequirements ? 8 : undefined}
          />
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {showPasswordRequirements && (
          <p className={styles.hint}>Must be at least 8 characters</p>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="submit"
        className={styles.submitButton}
        disabled={loading || !email || !password}
      >
        {loading ? <span className={styles.spinner} /> : submitLabel}
      </button>
    </form>
  );
}
