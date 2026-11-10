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

    // scrollHeight is the full text height whether or not it's clamped. Half a
    // line of slack absorbs rounding, since a real extra line is a whole line.
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 20;
      setNeedsExpansion(element.scrollHeight > lineHeight * (maxLines + 0.5));
    };

    measure();

    // Text rewraps when the width changes or a web font arrives
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    let isActive = true;
    document.fonts.ready.then(() => {
      if (isActive) measure();
    });

    return () => {
      isActive = false;
      observer.disconnect();
    };
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
