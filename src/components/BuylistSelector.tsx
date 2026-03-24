"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import {
  ShoppingCart,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  Trash2,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  DollarSign,
  StickyNote,
} from "lucide-react";
import { ADD_TO_BUYLIST, REMOVE_FROM_BUYLIST } from "@/graphql/mutations";
import { IS_IN_BUYLIST, GET_MY_BUYLIST } from "@/graphql/queries";
import styles from "./BuylistSelector.module.css";

export type BuylistPriority = "HIGH" | "MEDIUM" | "LOW";

interface PriorityConfig {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

const PRIORITY_CONFIG: Record<BuylistPriority, PriorityConfig> = {
  HIGH: { label: "High", icon: ArrowUp, color: "#ef4444" },
  MEDIUM: { label: "Medium", icon: ArrowRight, color: "#f97316" },
  LOW: { label: "Low", icon: ArrowDown, color: "#22c55e" },
};

interface BuylistSelectorProps {
  gameId?: string;
  bundleId?: string;
  variant?: "default" | "compact";
  className?: string;
}

export function BuylistSelector({
  gameId,
  bundleId,
  variant = "default",
  className = "",
}: BuylistSelectorProps) {
  const itemId = gameId || bundleId;
  const itemType = gameId ? "game" : "bundle";
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isInBuylist, setIsInBuylist] = useState(false);
  const [buylistItemId, setBuylistItemId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<BuylistPriority>("MEDIUM");
  const [estimatedPrice, setEstimatedPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading: queryLoading, refetch } = useQuery(IS_IN_BUYLIST, {
    variables: { gameId, bundleId },
    skip: !isSignedIn || !itemId,
  });

  // Also fetch the buylist to get the item ID if it exists
  const { data: buylistData } = useQuery(GET_MY_BUYLIST, {
    skip: !isSignedIn || !data?.isInBuylist,
  });

  const [addToBuylist, { loading: adding }] = useMutation(ADD_TO_BUYLIST, {
    refetchQueries: [
      { query: IS_IN_BUYLIST, variables: { gameId, bundleId } },
      { query: GET_MY_BUYLIST },
    ],
    onCompleted: (result) => {
      if (result.addToBuylist.success) {
        setIsInBuylist(true);
        setBuylistItemId(result.addToBuylist.buylistItem?.id || null);
        setIsOpen(false);
        // Reset form
        setEstimatedPrice("");
        setNotes("");
        setSelectedPriority("MEDIUM");
      }
    },
  });

  const [removeFromBuylist, { loading: removing }] = useMutation(REMOVE_FROM_BUYLIST, {
    refetchQueries: [
      { query: IS_IN_BUYLIST, variables: { gameId, bundleId } },
      { query: GET_MY_BUYLIST },
    ],
    onCompleted: (result) => {
      if (result.removeFromBuylist.success) {
        setIsInBuylist(false);
        setBuylistItemId(null);
        setIsOpen(false);
      }
    },
  });

  useEffect(() => {
    if (data?.isInBuylist !== undefined) {
      setIsInBuylist(data.isInBuylist);
    }
  }, [data]);

  useEffect(() => {
    if (buylistData?.myBuylist && isInBuylist) {
      const item = buylistData.myBuylist.find(
        (item: { gameId?: string; bundleId?: string; id: string }) =>
          (gameId && item.gameId === gameId) || (bundleId && item.bundleId === bundleId)
      );
      if (item) {
        setBuylistItemId(item.id);
      }
    }
  }, [buylistData, gameId, bundleId, isInBuylist]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = async () => {
    if (adding || removing || !itemId) return;

    const input: {
      gameId?: string;
      bundleId?: string;
      priority: BuylistPriority;
      estimatedPrice?: number;
      notes?: string;
    } = {
      priority: selectedPriority,
    };

    if (gameId) {
      input.gameId = gameId;
    } else if (bundleId) {
      input.bundleId = bundleId;
    }

    if (estimatedPrice && parseFloat(estimatedPrice) > 0) {
      input.estimatedPrice = parseFloat(estimatedPrice);
    }

    if (notes.trim()) {
      input.notes = notes.trim();
    }

    await addToBuylist({ variables: { input } });
  };

  const handleRemove = async () => {
    if (adding || removing || !buylistItemId) return;
    await removeFromBuylist({ variables: { id: buylistItemId } });
  };

  if (!isSignedIn || !itemId) {
    return null;
  }

  const loading = queryLoading || adding || removing;
  const priorityConfig = PRIORITY_CONFIG[selectedPriority];

  return (
    <div
      ref={dropdownRef}
      className={`${styles.container} ${styles[variant]} ${className}`}
    >
      <button
        className={`${styles.trigger} ${isInBuylist ? styles.hasStatus : ""} ${loading ? styles.loading : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        style={
          isInBuylist
            ? ({ "--status-color": "#a855f7" } as React.CSSProperties)
            : undefined
        }
      >
        <span className={styles.icon}>
          <ShoppingCart size={16} />
        </span>
        <span className={styles.label}>
          {isInBuylist ? "In Buylist" : "Add to Buylist"}
        </span>
        <span className={styles.chevron}>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {!isInBuylist ? (
            <>
              {/* Priority Selection */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>
                  <ArrowUp size={14} />
                  <span>Priority</span>
                </label>
                <div className={styles.priorityOptions}>
                  {(Object.keys(PRIORITY_CONFIG) as BuylistPriority[]).map((priority) => {
                    const config = PRIORITY_CONFIG[priority];
                    const isSelected = selectedPriority === priority;
                    const IconComponent = config.icon;

                    return (
                      <button
                        key={priority}
                        className={`${styles.priorityOption} ${isSelected ? styles.selected : ""}`}
                        onClick={() => setSelectedPriority(priority)}
                        disabled={loading}
                        style={
                          { "--option-color": config.color } as React.CSSProperties
                        }
                      >
                        <IconComponent size={14} />
                        <span>{config.label}</span>
                        {isSelected && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.divider} />

              {/* Estimated Price */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>
                  <DollarSign size={14} />
                  <span>Est. Price (optional)</span>
                </label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0.00"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div className={styles.divider} />

              {/* Notes */}
              <div className={styles.section}>
                <label className={styles.sectionLabel}>
                  <StickyNote size={14} />
                  <span>Notes (optional)</span>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Gift idea, preferred store, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  disabled={loading}
                />
              </div>

              <div className={styles.divider} />

              {/* Add Button */}
              <button
                className={styles.addButton}
                onClick={handleAdd}
                disabled={loading}
              >
                <Plus size={16} />
                <span>Add to Buylist</span>
              </button>
            </>
          ) : (
            <>
              <div className={styles.inBuylistMessage}>
                <Check size={16} />
                <span>This {itemType} is in your buylist</span>
              </div>
              <div className={styles.divider} />
              <button
                className={`${styles.option} ${styles.removeOption}`}
                onClick={handleRemove}
                disabled={loading}
              >
                <span className={styles.optionIcon}>
                  <Trash2 size={16} />
                </span>
                <span className={styles.optionLabel}>Remove from Buylist</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
