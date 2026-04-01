"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { X, Disc, Package, BookOpen, Gift, Lock } from "lucide-react";
import { ADD_TO_COLLECTION, UPDATE_COLLECTION_ITEM } from "@/graphql/mutations";
import { GET_MY_COLLECTION, GET_COLLECTION_STATS } from "@/graphql/queries";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import styles from "./AddToCollectionModal.module.css";

export type GameRegion = "NTSC_U" | "PAL" | "NTSC_J" | "OTHER";

const REGION_OPTIONS: { value: GameRegion; label: string }[] = [
  { value: "NTSC_U", label: "NTSC-U (North America)" },
  { value: "PAL", label: "PAL (Europe/Australia)" },
  { value: "NTSC_J", label: "NTSC-J (Japan)" },
  { value: "OTHER", label: "Other" },
];

interface Platform {
  id: string;
  name: string;
  slug: string;
}

interface Game {
  id: string;
  title: string;
  coverUrl?: string | null;
}

interface CollectionItem {
  id: string;
  gameId: string;
  platformId?: string | null;
  hasDisc: boolean;
  hasBox: boolean;
  hasManual: boolean;
  hasExtras: boolean;
  isSealed: boolean;
  region: GameRegion;
  notes?: string | null;
}

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  editingItem?: CollectionItem | null;
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  game,
  editingItem,
}: AddToCollectionModalProps) {
  const [platformId, setPlatformId] = useState<string>("");
  const [hasDisc, setHasDisc] = useState(false);
  const [hasBox, setHasBox] = useState(false);
  const [hasManual, setHasManual] = useState(false);
  const [hasExtras, setHasExtras] = useState(false);
  const [isSealed, setIsSealed] = useState(false);
  const [region, setRegion] = useState<GameRegion>("NTSC_U");
  const [notes, setNotes] = useState("");

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const platforms: Platform[] = platformsData?.platforms ?? [];

  const [addToCollection, { loading: adding }] = useMutation(ADD_TO_COLLECTION, {
    refetchQueries: [
      { query: GET_MY_COLLECTION },
      { query: GET_COLLECTION_STATS },
    ],
    onCompleted: (data) => {
      if (data.addToCollection.success) {
        onClose();
        resetForm();
        toast.success("Added to collection.");
      } else {
        toast.error(data.addToCollection.error?.message || "Failed to add to collection.");
      }
    },
    onError: (error) => toast.error(error.message || "Failed to add to collection."),
  });

  const [updateCollectionItem, { loading: updating }] = useMutation(
    UPDATE_COLLECTION_ITEM,
    {
      refetchQueries: [
        { query: GET_MY_COLLECTION },
        { query: GET_COLLECTION_STATS },
      ],
      onCompleted: (data) => {
        if (data.updateCollectionItem.success) {
          onClose();
          toast.success("Collection item updated.");
        } else {
          toast.error(data.updateCollectionItem.error?.message || "Failed to update item.");
        }
      },
      onError: (error) => toast.error(error.message || "Failed to update item."),
    }
  );

  const loading = adding || updating;

  // Initialize form when editing
  useEffect(() => {
    if (editingItem) {
      setPlatformId(editingItem.platformId ?? "");
      setHasDisc(editingItem.hasDisc);
      setHasBox(editingItem.hasBox);
      setHasManual(editingItem.hasManual);
      setHasExtras(editingItem.hasExtras);
      setIsSealed(editingItem.isSealed);
      setRegion(editingItem.region);
      setNotes(editingItem.notes ?? "");
    } else {
      resetForm();
    }
  }, [editingItem]);

  const resetForm = () => {
    setPlatformId("");
    setHasDisc(false);
    setHasBox(false);
    setHasManual(false);
    setHasExtras(false);
    setIsSealed(false);
    setRegion("NTSC_U");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const input = {
      platformId: platformId || null,
      hasDisc,
      hasBox,
      hasManual,
      hasExtras,
      isSealed,
      region,
      notes: notes || null,
    };

    if (editingItem) {
      await updateCollectionItem({
        variables: { id: editingItem.id, input },
      });
    } else {
      await addToCollection({
        variables: {
          input: {
            gameId: game.id,
            ...input,
          },
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editingItem ? "Edit Collection Item" : "Add to Collection"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.gameInfo}>
          {game.coverUrl && (
            <img
              src={game.coverUrl}
              alt={game.title}
              className={styles.gameCover}
            />
          )}
          <h3 className={styles.gameTitle}>{game.title}</h3>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Platform</label>
            <select
              className={styles.select}
              value={platformId}
              onChange={(e) => setPlatformId(e.target.value)}
            >
              <option value="">Select platform...</option>
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Components</label>
            <div className={styles.components}>
              <button
                type="button"
                className={`${styles.componentButton} ${hasDisc ? styles.active : ""}`}
                onClick={() => setHasDisc(!hasDisc)}
              >
                <Disc size={18} />
                <span>Disc</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasBox ? styles.active : ""}`}
                onClick={() => setHasBox(!hasBox)}
              >
                <Package size={18} />
                <span>Box</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasManual ? styles.active : ""}`}
                onClick={() => setHasManual(!hasManual)}
              >
                <BookOpen size={18} />
                <span>Manual</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasExtras ? styles.active : ""}`}
                onClick={() => setHasExtras(!hasExtras)}
              >
                <Gift size={18} />
                <span>Extras</span>
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <button
              type="button"
              className={`${styles.sealedButton} ${isSealed ? styles.active : ""}`}
              onClick={() => setIsSealed(!isSealed)}
            >
              <Lock size={18} />
              <span>Sealed / Factory Sealed</span>
            </button>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Region</label>
            <select
              className={styles.select}
              value={region}
              onChange={(e) => setRegion(e.target.value as GameRegion)}
            >
              {REGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Notes (optional)</label>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this item..."
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingItem
                  ? "Save Changes"
                  : "Add to Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
