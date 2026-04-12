"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./ExpandableText.module.css";

interface ExpandableTextProps {
  text: string;
  /** Number of lines to show when collapsed. Defaults to 3. */
  maxLines?: number;
  /** Custom className for the container */
  className?: string;
}

export function ExpandableText({
  text,
  maxLines = 3,
  className = "",
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Check if text overflows the collapsed height
    const lineHeight = parseInt(getComputedStyle(element).lineHeight) || 20;
    const maxHeight = lineHeight * maxLines;
    setNeedsExpansion(element.scrollHeight > maxHeight + 4); // 4px tolerance
  }, [text, maxLines]);

  if (!text) return null;

  return (
    <div className={`${styles.container} ${className}`}>
      <p
        ref={textRef}
        className={`${styles.text} ${!isExpanded && needsExpansion ? styles.collapsed : ""}`}
        style={
          !isExpanded && needsExpansion
            ? { WebkitLineClamp: maxLines }
            : undefined
        }
      >
        {text}
      </p>
      {needsExpansion && (
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
