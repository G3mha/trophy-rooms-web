"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import {
  Package,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  Edit2,
} from "lucide-react";
import { GET_MY_COLLECTION_FOR_GAME } from "@/graphql/queries";
import { AddToCollectionModal, type GameRegion } from "./AddToCollectionModal";
import styles from "./CollectionSelector.module.css";

interface CollectionItem {
  id: string;
  gameId: string;
  platformId?: string | null;
  platform?: { id: string; name: string } | null;
  hasDisc: boolean;
  hasBox: boolean;
  hasManual: boolean;
  hasExtras: boolean;
  isSealed: boolean;
  region: GameRegion;
  notes?: string | null;
}

interface Game {
  id: string;
  title: string;
  coverUrl?: string | null;
}

interface CollectionSelectorProps {
  game: Game;
  variant?: "default" | "compact";
  className?: string;
}

export function CollectionSelector({
  game,
  variant = "default",
  className = "",
}: CollectionSelectorProps) {
  const { isSignedIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, loading: queryLoading } = useQuery(GET_MY_COLLECTION_FOR_GAME, {
    variables: { gameId: game.id },
    skip: !isSignedIn,
  });

  const collectionItems: CollectionItem[] = data?.myCollectionForGame ?? [];
  const isInCollection = collectionItems.length > 0;

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

  const handleAddNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleEdit = (item: CollectionItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  if (!isSignedIn) {
    return null;
  }

  const loading = queryLoading;

  return (
    <>
      <div
        ref={dropdownRef}
        className={`${styles.container} ${styles[variant]} ${className}`}
      >
        <button
          className={`${styles.trigger} ${isInCollection ? styles.hasStatus : ""} ${loading ? styles.loading : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          style={
            isInCollection
              ? ({ "--status-color": "#10b981" } as React.CSSProperties)
              : undefined
          }
        >
          <span className={styles.icon}>
            <Package size={16} />
          </span>
          <span className={styles.label}>
            {isInCollection
              ? `In Collection (${collectionItems.length})`
              : "Add to Collection"}
          </span>
          <span className={styles.chevron}>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {isOpen && (
          <div className={styles.dropdown}>
            {isInCollection ? (
              <>
                <div className={styles.inCollectionMessage}>
                  <Check size={16} />
                  <span>
                    {collectionItems.length === 1
                      ? "1 copy in collection"
                      : `${collectionItems.length} copies in collection`}
                  </span>
                </div>

                <div className={styles.divider} />

                {/* List existing copies */}
                {collectionItems.map((item, index) => (
                  <button
                    key={item.id}
                    className={styles.option}
                    onClick={() => handleEdit(item)}
                  >
                    <span className={styles.optionIcon}>
                      <Edit2 size={16} />
                    </span>
                    <span className={styles.optionLabel}>
                      {item.platform?.name || `Copy ${index + 1}`}
                    </span>
                  </button>
                ))}

                <div className={styles.divider} />

                {/* Add another copy */}
                <button className={styles.addOption} onClick={handleAddNew}>
                  <span className={styles.optionIcon}>
                    <Plus size={16} />
                  </span>
                  <span className={styles.optionLabel}>Add another copy</span>
                </button>
              </>
            ) : (
              <button className={styles.addOption} onClick={handleAddNew}>
                <span className={styles.optionIcon}>
                  <Plus size={16} />
                </span>
                <span className={styles.optionLabel}>Add to Collection</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <AddToCollectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        game={game}
        editingItem={editingItem}
      />
    </>
  );
}
