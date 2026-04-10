"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
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
import { FormField } from "@/components/ui/form-field";
import { SelectableButton } from "@/components/ui/selectable-button";
import { handlePlatformIconError } from "@/lib/image-utils";
import { isValidHttpUrl, getFieldErrorClass } from "@/lib/validation-utils";
import { CoverPreview } from "./cover-preview";
import { GameSearchPicker, type SearchableGame } from "./game-search-picker";

const GAME_TYPE_LABELS: Record<string, string> = {
  BASE_GAME: "Base Game",
  FANGAME: "Fangame",
  ROM_HACK: "ROM Hack",
  MOD: "Mod",
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
  const [baseGames, setBaseGames] = useState<SearchableGame[]>([]);
  const [additionalPlatformIds, setAdditionalPlatformIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<GameFormErrors>({});

  // Use multi-select for DLC/Expansion when enabled
  const useMultiBaseGameSelect = enableMultiPlatformCreation && (type === "DLC" || type === "EXPANSION");

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
      // Initialize from baseGames array (new multi-select)
      const existingBaseGames = game.baseGames || [];
      setBaseGames(existingBaseGames);
      setBaseGame(existingBaseGames[0] || null);
      setAdditionalPlatformIds(new Set());
      setErrors({});
    }
  }, [gameData]);

  const handleSave = async () => {
    const newErrors: GameFormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Game title is required.";
    }

    // Platform is required for base games, but derived from base game for DLC/Expansion with multi-select
    if (!useMultiBaseGameSelect && !platformId) {
      newErrors.platformId = "Select a platform.";
    }

    if (type !== "BASE_GAME") {
      if (useMultiBaseGameSelect) {
        if (baseGames.length === 0) {
          newErrors.baseGame = "Select at least one base game for this entry type.";
        }
      } else if (!baseGame) {
        newErrors.baseGame = "Select the original game for this entry type.";
      }
    }

    if (coverUrl.trim() && !isValidHttpUrl(coverUrl.trim())) {
      newErrors.coverUrl = "Cover URL must start with http:// or https://.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // For multi-select mode, use first base game; otherwise use single selection
      const primaryBaseGame = useMultiBaseGameSelect ? baseGames[0] : baseGame;
      const effectivePlatformId = useMultiBaseGameSelect && primaryBaseGame?.platform?.id
        ? primaryBaseGame.platform.id
        : platformId;

      // Build baseGameIds from selected base games
      const baseGameIds = type !== "BASE_GAME"
        ? (useMultiBaseGameSelect ? baseGames.map(g => g.id) : (primaryBaseGame ? [primaryBaseGame.id] : []))
        : [];

      // Update the current game
      const { data } = await updateGame({
        variables: {
          id: gameId,
          input: {
            title: title.trim(),
            description: description.trim() || null,
            coverUrl: coverUrl.trim() || null,
            platformId: effectivePlatformId,
            type,
            baseGameIds,
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
        } else if (field === "baseGameIds") {
          setErrors({ baseGame: errorMessage });
        }
        return;
      }

      // Create copies for additional base games in multi-select mode
      let additionalCount = 0;
      if (useMultiBaseGameSelect && baseGames.length > 1) {
        // Skip the first one (already used for update), create for the rest
        for (let i = 1; i < baseGames.length; i++) {
          const additionalBaseGame = baseGames[i];
          if (additionalBaseGame?.platform?.id) {
            const { data: createData } = await createGame({
              variables: {
                input: {
                  title: title.trim(),
                  description: description.trim() || null,
                  coverUrl: coverUrl.trim() || null,
                  platformId: additionalBaseGame.platform.id,
                  type,
                  baseGameIds: [additionalBaseGame.id],
                },
              },
            });

            if (createData?.createGame?.success) {
              additionalCount++;
            }
          }
        }
      } else if (enableMultiPlatformCreation && type !== "BASE_GAME" && additionalPlatformIds.size > 0) {
        // Fallback: old additional platform selection logic
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
                  baseGameIds: [sibling.id],
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
    setBaseGames([]);
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

        <DialogBody className="flex flex-col gap-5 py-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Identity</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Core metadata used to identify and categorize the game.
              </p>
            </div>

            <FormField label="Game Title" required error={errors.title}>
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
            </FormField>

            {/* For DLC/Expansion with multi-select, show Type full-width; otherwise show Platform + Type grid */}
            {useMultiBaseGameSelect ? (
              <FormField label="Type" required>
                <Select
                  value={type}
                  onValueChange={(value) => {
                    const newType = value || "BASE_GAME";
                    setType(newType);
                    if (newType === "BASE_GAME") {
                      setBaseGame(null);
                      setBaseGames([]);
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
              </FormField>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Platform" required error={errors.platformId}>
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
                </FormField>

                <FormField label="Type" required>
                  <Select
                    value={type}
                    onValueChange={(value) => {
                      const newType = value || "BASE_GAME";
                      setType(newType);
                      if (newType === "BASE_GAME") {
                        setBaseGame(null);
                        setBaseGames([]);
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
                </FormField>
              </div>
            )}

            {/* Multi-select game picker for DLC/Expansion with multi-platform enabled */}
            {useMultiBaseGameSelect && (
              <FormField
                label="Based On"
                required
                hint={`Select one or more base games. Each creates a ${GAME_TYPE_LABELS[type].toLowerCase()} for that platform.`}
                error={errors.baseGame}
              >
                <GameSearchPicker
                  mode="multiple"
                  value={baseGames}
                  onChange={(value) => {
                    setBaseGames(value);
                    setErrors((prev) => ({ ...prev, baseGame: undefined }));
                  }}
                  placeholder="Search and select base games..."
                  excludeIds={[gameId]}
                  filterOption={(game) => game.type === "BASE_GAME" || !game.type}
                  emptyText="No base games found."
                />
              </FormField>
            )}

            {/* Single-select game picker for non-multi-select mode */}
            {!useMultiBaseGameSelect && type !== "BASE_GAME" && (
              <FormField
                label="Based On"
                required
                hint={`Search the full catalog to link this ${GAME_TYPE_LABELS[type].toLowerCase()} to its original game.`}
                error={errors.baseGame}
              >
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
              </FormField>
            )}

            {/* Legacy multi-platform selection - only show when NOT using multi-select mode */}
            {!useMultiBaseGameSelect && enableMultiPlatformCreation && type !== "BASE_GAME" && baseGameSiblings.length > 0 && (
              <FormField
                label="Also Create for Platforms"
                hint={`Optionally create this ${GAME_TYPE_LABELS[type].toLowerCase()} for other platform versions of the base game.`}
              >
                <div className="flex flex-col gap-1.5">
                  {baseGameSiblings.map((game: SearchableGame) => (
                    <SelectableButton
                      key={game.id}
                      selected={additionalPlatformIds.has(game.id)}
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
                      icon={
                        game.platform?.slug && (
                          <img
                            src={`/platforms/${game.platform.slug}.svg`}
                            alt=""
                            className="w-[18px] h-[18px]"
                            onError={handlePlatformIconError}
                          />
                        )
                      }
                    >
                      {game.platform?.name || "Unknown"}
                    </SelectableButton>
                  ))}
                </div>
              </FormField>
            )}
          </div>

          <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Details</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Supporting description and media for this record.
              </p>
            </div>

            <FormField label="Description">
              <Textarea
                placeholder="Enter game description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </FormField>

            <FormField
              label="Cover URL"
              hint="Use a direct image URL starting with http:// or https://."
              error={errors.coverUrl}
            >
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
            </FormField>

            {coverUrl.trim() && (
              <FormField label="Cover Preview">
                <CoverPreview url={coverUrl.trim()} alt="Game cover preview" />
              </FormField>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isLoading}>
            {useMultiBaseGameSelect && baseGames.length > 1
              ? `Save & Create for ${baseGames.length} Platforms`
              : additionalPlatformIds.size > 0
              ? `Save & Create for ${additionalPlatformIds.size} Platform${additionalPlatformIds.size > 1 ? "s" : ""}`
              : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
