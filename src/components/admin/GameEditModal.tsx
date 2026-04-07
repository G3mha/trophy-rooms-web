"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { GET_GAME } from "@/graphql/queries";
import { GET_GAMES_ADMIN, GET_PLATFORMS } from "@/graphql/admin_queries";
import { CREATE_GAME, UPDATE_GAME } from "@/graphql/admin_mutations";
import { Button } from "@/components";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CoverPreview } from "./cover-preview";
import { GameSearchPicker, type SearchableGame } from "./game-search-picker";
import styles from "@/app/admin/page.module.css";

const GAME_TYPE_LABELS: Record<string, string> = {
  BASE_GAME: "Base Game",
  FANGAME: "Fangame",
  ROM_HACK: "ROM Hack",
  DLC: "DLC",
  EXPANSION: "Expansion",
};

interface Platform {
  id: string;
  name: string;
  slug?: string;
}

interface GameFormErrors {
  title?: string;
  platformId?: string;
  coverUrl?: string;
  baseGame?: string;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFieldErrorClass(hasError: boolean) {
  return hasError
    ? "border-red-500 focus:border-red-500 focus:shadow-[inset_0_0_0_1px_rgb(239,68,68)]"
    : "";
}

function renderFieldError(message?: string) {
  if (!message) return null;
  return <span className="text-sm text-red-300">{message}</span>;
}

interface GameEditModalProps {
  gameId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after successful save, useful for refetching lists */
  onSuccess?: () => void;
  /** Enable multi-platform creation feature for DLC/Expansion */
  enableMultiPlatformCreation?: boolean;
}

export function GameEditModal({
  gameId,
  open,
  onOpenChange,
  onSuccess,
  enableMultiPlatformCreation = false,
}: GameEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [platformId, setPlatformId] = useState("");
  const [type, setType] = useState("BASE_GAME");
  const [baseGame, setBaseGame] = useState<SearchableGame | null>(null);
  const [additionalPlatformIds, setAdditionalPlatformIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<GameFormErrors>({});

  const { data: gameData, loading: loadingGame, refetch: refetchGame } = useQuery(GET_GAME, {
    variables: { id: gameId },
    skip: !open,
  });

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const platforms = useMemo(() => platformsData?.platforms || [], [platformsData]);

  // Query for sibling games when editing DLC/Expansion (same title as base game, different platforms)
  const { data: baseGameSiblingsData } = useQuery(GET_GAMES_ADMIN, {
    variables: {
      first: 20,
      orderBy: "TITLE_ASC",
      search: baseGame?.title || undefined,
    },
    skip: !baseGame?.title || type === "BASE_GAME" || !enableMultiPlatformCreation,
  });

  // Filter to only show siblings with exact title match
  const baseGameSiblings = useMemo(() => {
    if (!baseGameSiblingsData?.games?.edges || !baseGame) return [];
    return baseGameSiblingsData.games.edges
      .map((edge: { node: SearchableGame }) => edge.node)
      .filter(
        (game: SearchableGame) =>
          game.title === baseGame.title &&
          game.type !== "DLC" &&
          game.type !== "EXPANSION" &&
          game.id !== baseGame.id
      );
  }, [baseGameSiblingsData, baseGame]);

  const [updateGame, { loading: updating }] = useMutation(UPDATE_GAME);
  const [createGame, { loading: creating }] = useMutation(CREATE_GAME);

  const isLoading = updating || creating;

  useEffect(() => {
    if (gameData?.game) {
      const game = gameData.game;
      setTitle(game.title || "");
      setDescription(game.description || "");
      setCoverUrl(game.coverUrl || "");
      setPlatformId(game.platform?.id || "");
      setType(game.type || "BASE_GAME");
      setBaseGame(game.baseGame || null);
      setAdditionalPlatformIds(new Set());
      setErrors({});
    }
  }, [gameData]);

  const handleSave = async () => {
    const newErrors: GameFormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Game title is required.";
    }

    if (!platformId) {
      newErrors.platformId = "Select a platform.";
    }

    if (type !== "BASE_GAME" && !baseGame) {
      newErrors.baseGame = "Select the original game for this entry type.";
    }

    if (coverUrl.trim() && !isValidHttpUrl(coverUrl.trim())) {
      newErrors.coverUrl = "Cover URL must start with http:// or https://.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // Update the current game
      const { data } = await updateGame({
        variables: {
          id: gameId,
          input: {
            title: title.trim(),
            description: description.trim() || null,
            coverUrl: coverUrl.trim() || null,
            platformId,
            type,
            baseGameId: type !== "BASE_GAME" ? baseGame?.id || null : null,
          },
        },
      });

      const payload = data?.updateGame;
      if (!payload?.success) {
        const errorMessage = payload?.error?.message || "Failed to update game.";
        toast.error(errorMessage);

        const field = payload?.error?.field;
        if (field === "title") {
          setErrors({ title: errorMessage });
        } else if (field === "platformId") {
          setErrors({ platformId: errorMessage });
        } else if (field === "coverUrl") {
          setErrors({ coverUrl: errorMessage });
        } else if (field === "baseGameId") {
          setErrors({ baseGame: errorMessage });
        }
        return;
      }

      // Create copies for additional platforms if enabled and selected
      let additionalCount = 0;
      if (enableMultiPlatformCreation && type !== "BASE_GAME" && additionalPlatformIds.size > 0) {
        for (const siblingId of additionalPlatformIds) {
          const sibling = baseGameSiblings.find((g: SearchableGame) => g.id === siblingId);
          if (sibling?.platform?.id) {
            const { data: createData } = await createGame({
              variables: {
                input: {
                  title: title.trim(),
                  description: description.trim() || null,
                  coverUrl: coverUrl.trim() || null,
                  platformId: sibling.platform.id,
                  type,
                  baseGameId: sibling.id,
                },
              },
            });

            if (createData?.createGame?.success) {
              additionalCount++;
            }
          }
        }
      }

      onOpenChange(false);

      if (additionalCount > 0) {
        toast.success(
          `Saved changes to ${payload.game.title} and created for ${additionalCount} additional platform${additionalCount > 1 ? "s" : ""}.`
        );
      } else {
        toast.success("Game updated successfully.");
      }

      refetchGame();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update game.");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setErrors({});
    setAdditionalPlatformIds(new Set());
  };

  if (loadingGame && open) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>Loading game data...</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--nintendo-red)] border-t-transparent" />
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit Game</DialogTitle>
          <DialogDescription>
            Update identity, relationships, and media for this game.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className={styles.modalForm}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Identity</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Core metadata used to identify and categorize the game.
              </p>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Game Title *</label>
              <Input
                placeholder="Enter game title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, title: undefined }));
                }}
                className={getFieldErrorClass(Boolean(errors.title))}
                aria-invalid={Boolean(errors.title)}
              />
              {renderFieldError(errors.title)}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={styles.formField}>
                <label className={styles.formLabel}>Platform *</label>
                <Select
                  value={platformId}
                  onValueChange={(value) => {
                    setPlatformId(value || "");
                    setErrors((prev) => ({ ...prev, platformId: undefined }));
                  }}
                >
                  <SelectTrigger className={getFieldErrorClass(Boolean(errors.platformId))}>
                    <span>
                      {platforms.find((p: Platform) => p.id === platformId)?.name ||
                        "Select a platform"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform: Platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderFieldError(errors.platformId)}
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Type *</label>
                <Select
                  value={type}
                  onValueChange={(value) => {
                    const newType = value || "BASE_GAME";
                    setType(newType);
                    if (newType === "BASE_GAME") {
                      setBaseGame(null);
                      setAdditionalPlatformIds(new Set());
                      setErrors((prev) => ({ ...prev, baseGame: undefined }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <span>{GAME_TYPE_LABELS[type]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GAME_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {type !== "BASE_GAME" && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Based On *</label>
                <GameSearchPicker
                  mode="single"
                  value={baseGame}
                  onChange={(value) => {
                    setBaseGame(value);
                    setAdditionalPlatformIds(new Set());
                    setErrors((prev) => ({ ...prev, baseGame: undefined }));
                  }}
                  placeholder="Search the full game catalog..."
                  excludeIds={[gameId]}
                  filterOption={(game) => game.type === "BASE_GAME" || !game.type}
                  emptyText="No base games found."
                />
                <span className={styles.formHint}>
                  Search the full catalog to link this {GAME_TYPE_LABELS[type].toLowerCase()} to its
                  original game.
                </span>
                {renderFieldError(errors.baseGame)}
              </div>
            )}

            {/* Multi-platform selection for DLC/Expansion when editing */}
            {enableMultiPlatformCreation && type !== "BASE_GAME" && baseGameSiblings.length > 0 && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Also Create for Platforms</label>
                <span className={styles.formHint} style={{ marginBottom: 8, display: "block" }}>
                  Optionally create this {GAME_TYPE_LABELS[type].toLowerCase()} for other platform
                  versions of the base game.
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {baseGameSiblings.map((game: SearchableGame) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        setAdditionalPlatformIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(game.id)) {
                            next.delete(game.id);
                          } else {
                            next.add(game.id);
                          }
                          return next;
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: additionalPlatformIds.has(game.id)
                          ? "rgba(230, 0, 18, 0.15)"
                          : "var(--bg-secondary)",
                        border: additionalPlatformIds.has(game.id)
                          ? "1px solid var(--nintendo-red)"
                          : "1px solid var(--border-color)",
                        borderRadius: "var(--border-radius)",
                        cursor: "pointer",
                        color: "var(--text-primary)",
                        fontSize: 14,
                        textAlign: "left",
                      }}
                    >
                      {game.platform?.slug && (
                        <img
                          src={`/platforms/${game.platform.slug}.svg`}
                          alt=""
                          style={{ width: 18, height: 18 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <span style={{ flex: 1 }}>{game.platform?.name || "Unknown"}</span>
                      {additionalPlatformIds.has(game.id) && (
                        <Check size={16} style={{ color: "var(--nintendo-red)" }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Details</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Supporting description and media for this record.
              </p>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Description</label>
              <Textarea
                placeholder="Enter game description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Cover URL</label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={coverUrl}
                onChange={(e) => {
                  setCoverUrl(e.target.value);
                  setErrors((prev) => ({ ...prev, coverUrl: undefined }));
                }}
                className={getFieldErrorClass(Boolean(errors.coverUrl))}
                aria-invalid={Boolean(errors.coverUrl)}
              />
              <span className={styles.formHint}>
                Use a direct image URL starting with http:// or https://.
              </span>
              {renderFieldError(errors.coverUrl)}
            </div>

            {coverUrl.trim() && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Cover Preview</label>
                <CoverPreview url={coverUrl.trim()} alt="Game cover preview" />
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isLoading}>
            {additionalPlatformIds.size > 0
              ? `Save & Create for ${additionalPlatformIds.size} Platform${additionalPlatformIds.size > 1 ? "s" : ""}`
              : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
