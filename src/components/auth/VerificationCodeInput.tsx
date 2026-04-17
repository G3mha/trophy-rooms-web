"use client";

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { FormAlert } from "@/components";
import styles from "./VerificationCodeInput.module.css";

interface VerificationCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  loading?: boolean;
  error?: string;
}

export function VerificationCodeInput({
  length = 6,
  onComplete,
  loading = false,
  error,
}: VerificationCodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (loading) return;

    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all digits are filled
    const code = newValues.join("");
    if (code.length === length && !code.includes("")) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (loading) return;

    if (e.key === "Backspace") {
      if (!values[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (loading) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

    if (pastedData) {
      const newValues = [...values];
      for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i];
      }
      setValues(newValues);

      // Focus the next empty input or the last one
      const nextEmptyIndex = newValues.findIndex((v) => !v);
      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[length - 1]?.focus();
      }

      // Check if complete
      const code = newValues.join("");
      if (code.length === length) {
        onComplete(code);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        {values.map((value, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={`${styles.input} ${error ? styles.inputError : ""}`}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
            maxLength={1}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
      {error && <FormAlert message={error} />}
    </div>
  );
}
