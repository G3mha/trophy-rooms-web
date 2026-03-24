"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import {
  Package,
  Plus,
  ChevronUp,
  ChevronDown,
  Check,
  Trash2,
  Disc,
  BookOpen,
  Gift,
  Lock,
  Globe,
  StickyNote,
  Monitor,
} from "lucide-react";
import { ADD_TO_COLLECTION, REMOVE_FROM_COLLECTION } from "@/graphql/mutations";
import { GET_MY_COLLECTION_FOR_GAME, GET_MY_COLLECTION, GET_COLLECTION_STATS } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import styles from "./CollectionSelector.module.css";

export type GameRegion = "NTSC_U" | "PAL" | "NTSC_J" | "OTHER";

const REGION_OPTIONS: { value: GameRegion; label: string }[] = [
  { value: "NTSC_U", label: "NTSC-U" },
  { value: "PAL", label: "PAL" },
  { value: "NTSC_J", label: "NTSC-J" },
  { value: "OTHER", label: "Other" },
];

interface Platform {
  id: string;
  name: string;
  slug: string;
}

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [platformId, setPlatformId] = useState<string>("");
  const [hasDisc, setHasDisc] = useState(true);
  const [hasBox, setHasBox] = useState(false);
  const [hasManual, setHasManual] = useState(false);
  const [hasExtras, setHasExtras] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [region, setRegion] = useState<GameRegion>("NTSC_U");
  const [notes, setNotes] = useState("");

  const { data, loading: queryLoading } = useQuery(GET_MY_COLLECTION_FOR_GAME, {
    variables: { gameId: game.id },
    skip: !isSignedIn,
  });

  const { data: platformsData } = useQuery(GET_PLATFORMS, {
    skip: !isSignedIn,
  });

  const platforms: Platform[] = platformsData?.platforms ?? [];
  const collectionItems: CollectionItem[] = data?.myCollectionForGame ?? [];
  const isInCollection = collectionItems.length > 0;

  const [addToCollection, { loading: adding }] = useMutation(ADD_TO_COLLECTION, {
    refetchQueries: [
      { query: GET_MY_COLLECTION_FOR_GAME, variables: { gameId: game.id } },
      { query: GET_MY_COLLECTION },
      { query: GET_COLLECTION_STATS },
    ],
    onCompleted: (result) => {
      if (result.addToCollection.success) {
        setIsOpen(false);
        resetForm();
      }
    },
  });

  const [removeFromCollection, { loading: removing }] = useMutation(
    REMOVE_FROM_COLLECTION,
    {
      refetchQueries: [
        { query: GET_MY_COLLECTION_FOR_GAME, variables: { gameId: game.id } },
        { query: GET_MY_COLLECTION },
        { query: GET_COLLECTION_STATS },
      ],
    }
  );

  const resetForm = () => {
    setPlatformId("");
    setHasDisc(true);
    setHasBox(false);
    setHasManual(false);
    setHasExtras(false);
    setIsSealed(false);
    setRegion("NTSC_U");
    setNotes("");
  };

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
    if (adding || removing) return;

    const input = {
      gameId: game.id,
      platformId: platformId || null,
      hasDisc,
      hasBox,
      hasManual,
      hasExtras,
      isSealed,
      region,
      notes: notes.trim() || null,
    };

    await addToCollection({ variables: { input } });
  };

  const handleRemove = async (itemId: string) => {
    if (adding || removing) return;
    await removeFromCollection({ variables: { id: itemId } });
  };

  if (!isSignedIn) {
    return null;
  }

  const loading = queryLoading || adding || removing;

  return (
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
                <div key={item.id} className={styles.collectionItemRow}>
                  <span className={styles.collectionItemInfo}>
                    <Package size={14} />
                    <span>{item.platform?.name || `Copy ${index + 1}`}</span>
                    {item.region && (
                      <span className={styles.regionBadge}>{item.region.replace("_", "-")}</span>
                    )}
                  </span>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemove(item.id)}
                    disabled={loading}
                    title="Remove from collection"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <div className={styles.divider} />

              {/* Add another copy form */}
              <div className={styles.formHeader}>
                <Plus size={14} />
                <span>Add another copy</span>
              </div>
            </>
          ) : null}

          {/* Form Section */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              <Monitor size={14} />
              <span>Platform</span>
            </label>
            <select
              className={styles.select}
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select platform...</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.divider} />

          {/* Components */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              <Package size={14} />
              <span>Components</span>
            </label>
            <div className={styles.componentGrid}>
              <button
                type="button"
                className={`${styles.componentButton} ${hasDisc ? styles.active : ""}`}
                onClick={() => setHasDisc(!hasDisc)}
                disabled={loading}
              >
                <Disc size={14} />
                <span>Disc</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasBox ? styles.active : ""}`}
                onClick={() => setHasBox(!hasBox)}
                disabled={loading}
              >
                <Package size={14} />
                <span>Box</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasManual ? styles.active : ""}`}
                onClick={() => setHasManual(!hasManual)}
                disabled={loading}
              >
                <BookOpen size={14} />
                <span>Manual</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasExtras ? styles.active : ""}`}
                onClick={() => setHasExtras(!hasExtras)}
                disabled={loading}
              >
                <Gift size={14} />
                <span>Extras</span>
              </button>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Sealed toggle */}
          <div className={styles.section}>
            <button
              type="button"
              className={`${styles.sealedButton} ${isSealed ? styles.active : ""}`}
              onClick={() => setIsSealed(!isSealed)}
              disabled={loading}
            >
              <Lock size={14} />
              <span>Factory Sealed</span>
              {isSealed && <Check size={14} />}
            </button>
          </div>

          <div className={styles.divider} />

          {/* Region */}
          <div className={styles.section}>
            <label className={styles.sectionLabel}>
              <Globe size={14} />
              <span>Region</span>
            </label>
            <div className={styles.regionOptions}>
              {REGION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.regionOption} ${region === option.value ? styles.selected : ""}`}
                  onClick={() => setRegion(option.value)}
                  disabled={loading}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
              placeholder="Condition, purchase info, etc."
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
            <span>{isInCollection ? "Add Copy" : "Add to Collection"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
