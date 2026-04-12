"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLazyQuery } from "@apollo/client";
import { Search, Gamepad2, Package, Puzzle, X } from "lucide-react";
import { GLOBAL_SEARCH } from "@/graphql/queries";
import styles from "./GlobalSearch.module.css";

type SearchResultType = "GAME" | "BUNDLE" | "DLC";

interface SearchItem {
  id: string;
  type: SearchResultType;
  title: string;
  coverUrl?: string | null;
  subtitle?: string | null;
}

interface GlobalSearchResults {
  items: SearchItem[];
  gameCount: number;
  bundleCount: number;
  dlcCount: number;
  totalCount: number;
}

function getResultIcon(type: SearchResultType) {
  switch (type) {
    case "GAME":
      return <Gamepad2 size={16} />;
    case "BUNDLE":
      return <Package size={16} />;
    case "DLC":
      return <Puzzle size={16} />;
  }
}

function getResultHref(item: SearchItem): string {
  switch (item.type) {
    case "GAME":
      return `/games/title/${item.id}`;
    case "BUNDLE":
      return `/bundles/${item.id}`;
    case "DLC":
      return `/dlcs/${item.id}`;
  }
}

function getTypeLabel(type: SearchResultType): string {
  switch (type) {
    case "GAME":
      return "Game";
    case "BUNDLE":
      return "Bundle";
    case "DLC":
      return "DLC";
  }
}

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
}

export function GlobalSearch({
  placeholder = "Search games, DLCs, bundles...",
  className = "",
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [search, { data, loading }] = useLazyQuery<{
    globalSearch: GlobalSearchResults;
  }>(GLOBAL_SEARCH);

  const results = data?.globalSearch?.items ?? [];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = query.trim();
      setDebouncedQuery(trimmed);
      if (trimmed.length >= 2) {
        search({ variables: { query: trimmed, limit: 10 } });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Open dropdown when we have results
  useEffect(() => {
    if (debouncedQuery.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  }, [debouncedQuery, results.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (item: SearchItem) => {
    setQuery("");
    setIsOpen(false);
    router.push(getResultHref(item));
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (debouncedQuery.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`${styles.container} ${className}`}>
      <div className={styles.inputWrapper}>
        <Search className={styles.searchIcon} size={20} />
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
        />
        {query && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && debouncedQuery.length >= 2 && (
        <div className={styles.dropdown}>
          {loading && (
            <div className={styles.loading}>Searching...</div>
          )}

          {!loading && results.length === 0 && (
            <div className={styles.empty}>
              No results found for &ldquo;{debouncedQuery}&rdquo;
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <ul className={styles.results}>
                {results.map((item, index) => (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      className={`${styles.resultItem} ${
                        index === selectedIndex ? styles.selected : ""
                      }`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className={styles.resultImage}>
                        {item.coverUrl ? (
                          <img src={item.coverUrl} alt="" />
                        ) : (
                          <div className={styles.resultPlaceholder}>
                            {getResultIcon(item.type)}
                          </div>
                        )}
                      </div>
                      <div className={styles.resultContent}>
                        <span className={styles.resultTitle}>{item.title}</span>
                        {item.subtitle && (
                          <span className={styles.resultSubtitle}>
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                      <span className={`${styles.resultType} ${styles[`type${item.type}`]}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {data?.globalSearch && (
                <div className={styles.footer}>
                  <span className={styles.footerCount}>
                    {data.globalSearch.totalCount} results
                  </span>
                  <div className={styles.footerTypes}>
                    {data.globalSearch.gameCount > 0 && (
                      <span className={styles.footerType}>
                        {data.globalSearch.gameCount} games
                      </span>
                    )}
                    {data.globalSearch.dlcCount > 0 && (
                      <span className={styles.footerType}>
                        {data.globalSearch.dlcCount} DLCs
                      </span>
                    )}
                    {data.globalSearch.bundleCount > 0 && (
                      <span className={styles.footerType}>
                        {data.globalSearch.bundleCount} bundles
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
