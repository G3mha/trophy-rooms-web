"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { X, Disc, Package, BookOpen, Gift, Lock, Cloud } from "lucide-react";
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

interface GameVersion {
  id: string;
  name: string;
  isDefault: boolean;
  digitalOnly?: boolean;
}

interface CollectionItem {
  id: string;
  gameId: string;
  platformId?: string | null;
  gameVersionId?: string | null;
  hasDisc: boolean;
  hasBox: boolean;
  hasManual: boolean;
  hasExtras: boolean;
  isDigital: boolean;
  isSealed: boolean;
  region: GameRegion;
  notes?: string | null;
}

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  versions?: GameVersion[];
  editingItem?: CollectionItem | null;
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  game,
  versions = [],
  editingItem,
}: AddToCollectionModalProps) {
  const [platformId, setPlatformId] = useState<string>("");
  const [gameVersionId, setGameVersionId] = useState<string>("");
  const [hasDisc, setHasDisc] = useState(false);
  const [hasBox, setHasBox] = useState(false);
  const [hasManual, setHasManual] = useState(false);
  const [hasExtras, setHasExtras] = useState(false);
  const [isDigital, setIsDigital] = useState(false);
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

  // Get the selected version object
  const selectedVersion = versions.find((v) => v.id === gameVersionId);
  const isDigitalOnlyVersion = selectedVersion?.digitalOnly ?? false;

  // Check if form is valid (version required when versions exist)
  const isFormValid = versions.length === 0 || gameVersionId !== "";

  // Initialize form when editing
  useEffect(() => {
    if (editingItem) {
      setPlatformId(editingItem.platformId ?? "");
      setGameVersionId(editingItem.gameVersionId ?? "");
      setHasDisc(editingItem.hasDisc);
      setHasBox(editingItem.hasBox);
      setHasManual(editingItem.hasManual);
      setHasExtras(editingItem.hasExtras);
      setIsDigital(editingItem.isDigital);
      setIsSealed(editingItem.isSealed);
      setRegion(editingItem.region);
      setNotes(editingItem.notes ?? "");
    } else {
      resetForm();
    }
  }, [editingItem]);

  // Auto-select version: if only one version, select it; otherwise select default
  useEffect(() => {
    if (editingItem) return; // Don't auto-select when editing
    if (gameVersionId) return; // Don't override existing selection

    if (versions.length === 1) {
      setGameVersionId(versions[0].id);
    } else if (versions.length > 1) {
      const defaultVersion = versions.find((v) => v.isDefault);
      if (defaultVersion) {
        setGameVersionId(defaultVersion.id);
      }
    }
  }, [versions, editingItem, gameVersionId]);

  // Enforce isDigital when a digital-only version is selected
  useEffect(() => {
    if (isDigitalOnlyVersion && !isDigital) {
      setIsDigital(true);
    }
  }, [isDigitalOnlyVersion, isDigital]);

  const resetForm = () => {
    setPlatformId("");
    setGameVersionId("");
    setHasDisc(false);
    setHasBox(false);
    setHasManual(false);
    setHasExtras(false);
    setIsDigital(false);
    setIsSealed(false);
    setRegion("NTSC_U");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const input = {
      platformId: platformId || null,
      gameVersionId: gameVersionId || null,
      hasDisc: isDigital ? false : hasDisc,
      hasBox: isDigital ? false : hasBox,
      hasManual: isDigital ? false : hasManual,
      hasExtras: isDigital ? false : hasExtras,
      isDigital,
      isSealed: isDigital ? false : isSealed,
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

          {versions.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>
                Version {versions.length > 0 && <span className={styles.required}>*</span>}
              </label>
              {versions.length === 1 ? (
                <div className={styles.readOnlyValue}>
                  {versions[0].name}
                  {versions[0].digitalOnly && " (Digital Only)"}
                </div>
              ) : (
                <select
                  className={styles.select}
                  value={gameVersionId}
                  onChange={(e) => setGameVersionId(e.target.value)}
                  required
                >
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {version.name}
                      {version.isDefault ? " (Default)" : ""}
                      {version.digitalOnly ? " - Digital Only" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className={styles.field}>
            <button
              type="button"
              className={`${styles.sealedButton} ${isDigital ? styles.active : ""}`}
              onClick={() => !isDigitalOnlyVersion && setIsDigital(!isDigital)}
              disabled={isDigitalOnlyVersion}
            >
              <Cloud size={18} />
              <span>Digital Copy</span>
            </button>
            {isDigitalOnlyVersion && (
              <p className={styles.hint}>This version is only available as a digital copy.</p>
            )}
            {isDigital && !isDigitalOnlyVersion && (
              <p className={styles.hint}>Physical components are not applicable for digital copies.</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Components</label>
            <div className={`${styles.components} ${isDigital ? styles.disabled : ""}`}>
              <button
                type="button"
                className={`${styles.componentButton} ${hasDisc ? styles.active : ""}`}
                onClick={() => !isDigital && setHasDisc(!hasDisc)}
                disabled={isDigital}
              >
                <Disc size={18} />
                <span>Disc</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasBox ? styles.active : ""}`}
                onClick={() => !isDigital && setHasBox(!hasBox)}
                disabled={isDigital}
              >
                <Package size={18} />
                <span>Box</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasManual ? styles.active : ""}`}
                onClick={() => !isDigital && setHasManual(!hasManual)}
                disabled={isDigital}
              >
                <BookOpen size={18} />
                <span>Manual</span>
              </button>
              <button
                type="button"
                className={`${styles.componentButton} ${hasExtras ? styles.active : ""}`}
                onClick={() => !isDigital && setHasExtras(!hasExtras)}
                disabled={isDigital}
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
              onClick={() => !isDigital && setIsSealed(!isSealed)}
              disabled={isDigital}
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
              disabled={loading || !isFormValid}
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
