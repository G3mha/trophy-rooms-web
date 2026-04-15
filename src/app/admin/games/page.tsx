"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { toast } from "sonner";
import {
  AdminConfirmDialog,
  CoverPreview,
  GameCloneModal,
  GameEditModal,
  GameSearchPicker,
  type SearchableGame,
} from "@/components/admin";
import { FormField } from "@/components/ui/form-field";
import { SelectableButton } from "@/components/ui/selectable-button";
import { Button, LoadingSpinner, Pagination } from "@/components";
import { handlePlatformIconError } from "@/lib/image-utils";
import { isValidHttpUrl, getFieldErrorClass } from "@/lib/validation-utils";
import { GET_ADMIN_GAMES, GET_GAMES_ADMIN, GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  BULK_DELETE_GAMES,
  CREATE_GAME,
  DELETE_GAME,
} from "@/graphql/admin_mutations";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import styles from "../page.module.css";

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
}

// AdminGameItem from backend adminGames query
interface AdminGameItem {
  id: string;
  gameFamilyId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  type?: string | null;
  baseGameFamilyIds?: string[] | null;
  platformId?: string | null;
  platformName?: string | null;
  platformSlug?: string | null;
  achievementSetCount: number;
}

// Game family group for display (like iOS AdminGameGroup)
interface AdminGameGroup {
  gameFamilyId: string;
  title: string;
  games: AdminGameItem[];
  totalAchievements: number;
}

// Legacy Game interface for mutations and edit modal
interface Game {
  id: string;
  gameFamilyId: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  platform?: Platform | null;
  type?: string | null;
  baseGame?: SearchableGame | null;
  achievementCount: number;
}

interface ConfirmState {
  kind: "single" | "bulk";
  title: string;
  description: string;
  gameId?: string;
}

interface GameFormErrors {
  title?: string;
  platformId?: string;
  baseGame?: string;
  coverUrl?: string;
}

const DEFAULT_PAGE_SIZE = 20;

function getMutationMessage(error?: { message?: string | null } | null) {
  return error?.message || "Something went wrong. Please try again.";
}

function validateGameForm(input: {
  title: string;
  platformId: string;
  type: string;
  baseGame: SearchableGame | null;
  coverUrl: string;
}) {
  const errors: GameFormErrors = {};

  if (!input.title.trim()) {
    errors.title = "Game title is required.";
  }

  if (!input.platformId) {
    errors.platformId = "Select a platform.";
  }

  if (input.type !== "BASE_GAME" && !input.baseGame) {
    errors.baseGame = "Select the original game for this entry type.";
  }

  if (input.coverUrl.trim() && !isValidHttpUrl(input.coverUrl.trim())) {
    errors.coverUrl = "Cover URL must start with http:// or https://.";
  }

  return errors;
}

// Convert AdminGameItem to Game for modals
function convertToGame(item: AdminGameItem): Game {
  return {
    id: item.id,
    gameFamilyId: item.gameFamilyId,
    title: item.title,
    description: item.description,
    coverUrl: item.coverUrl,
    platform: item.platformId
      ? {
          id: item.platformId,
          name: item.platformName || "",
        }
      : null,
    type: item.type,
    baseGame: null,
    achievementCount: item.achievementSetCount,
  };
}

export default function AdminGamesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newPlatformId, setNewPlatformId] = useState("");
  const [newType, setNewType] = useState("BASE_GAME");
  const [newBaseGame, setNewBaseGame] = useState<SearchableGame | null>(null);
  const [newAdditionalPlatformIds, setNewAdditionalPlatformIds] = useState<Set<string>>(new Set());
  const [newErrors, setNewErrors] = useState<GameFormErrors>({});

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneGame, setCloneGame] = useState<Game | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const [groupByTitle, setGroupByTitle] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string | null>(null); // null = all types

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const {
    data: gamesData,
    loading,
    refetch,
  } = useQuery(GET_ADMIN_GAMES, {
    variables: {
      page: currentPage,
      pageSize: pageSize,
      search: debouncedSearch || undefined,
    },
  });

  // Query for sibling games when creating DLC/Expansion (same title as base game, different platforms)
  const { data: baseGameSiblingsData } = useQuery(GET_GAMES_ADMIN, {
    variables: {
      first: 20,
      orderBy: "TITLE_ASC",
      search: newBaseGame?.title || undefined,
    },
    skip: !newBaseGame?.title || newType === "BASE_GAME",
  });

  // Filter to only show siblings with exact title match
  const baseGameSiblings = useMemo(() => {
    if (!baseGameSiblingsData?.games?.edges || !newBaseGame) return [];
    return baseGameSiblingsData.games.edges
      .map((edge: { node: SearchableGame }) => edge.node)
      .filter(
        (game: SearchableGame) =>
          game.title === newBaseGame.title &&
          game.type !== "DLC" &&
          game.type !== "EXPANSION"
      );
  }, [baseGameSiblingsData, newBaseGame]);

  const [createGame, { loading: creating }] = useMutation(CREATE_GAME);
  const [deleteGame, { loading: deleting }] = useMutation(DELETE_GAME);
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_GAMES);

  const platforms = useMemo(() => platformsData?.platforms || [], [platformsData]);

  // Extract items from adminGames query
  const adminGames = useMemo<AdminGameItem[]>(() => {
    const allGames = gamesData?.adminGames?.items || [];

    if (typeFilter === null) {
      // Default: show all except DLC and EXPANSION (they have their own admin page)
      return allGames.filter(
        (game: AdminGameItem) => game.type !== "DLC" && game.type !== "EXPANSION"
      );
    }

    // Filter by specific type
    return allGames.filter((game: AdminGameItem) => game.type === typeFilter);
  }, [gamesData, typeFilter]);

  const totalCount = gamesData?.adminGames?.totalCount || 0;
  const totalPages = gamesData?.adminGames?.totalPages || Math.ceil(totalCount / pageSize);

  // Group games by gameFamilyId (like iOS AdminGameGroup)
  const groupedGames = useMemo<AdminGameGroup[]>(() => {
    if (!groupByTitle) return [];

    const groups = new Map<string, AdminGameItem[]>();
    adminGames.forEach((game: AdminGameItem) => {
      const key = game.gameFamilyId;
      const existing = groups.get(key) || [];
      existing.push(game);
      groups.set(key, existing);
    });

    return Array.from(groups.entries()).map(([gameFamilyId, gameList]) => ({
      gameFamilyId,
      title: gameList[0]?.title || "",
      games: gameList,
      totalAchievements: gameList.reduce(
        (sum, game) => sum + game.achievementSetCount,
        0
      ),
    }));
  }, [adminGames, groupByTitle]);

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCoverUrl("");
    setNewPlatformId("");
    setNewType("BASE_GAME");
    setNewBaseGame(null);
    setNewAdditionalPlatformIds(new Set());
    setNewErrors({});
  };

  const handleMutationFailure = (
    message: string,
    setErrors?: (errors: GameFormErrors) => void,
    field?: string | null
  ) => {
    toast.error(message);

    if (!setErrors || !field) return;

    if (field === "title") {
      setErrors({ title: message });
    } else if (field === "platformId") {
      setErrors({ platformId: message });
    } else if (field === "coverUrl") {
      setErrors({ coverUrl: message });
    } else if (field === "baseGameIds") {
      setErrors({ baseGame: message });
    }
  };

  const handleCreateGame = async () => {
    // For DLC/Expansion, platforms come from sibling selection
    const isDlcOrExpansion = newType !== "BASE_GAME";
    const hasSelectedPlatforms = newAdditionalPlatformIds.size > 0;

    // Validate form - skip platform for DLC/Expansion since it comes from siblings
    const errors = validateGameForm({
      title: newTitle,
      platformId: isDlcOrExpansion ? "skip" : newPlatformId,
      type: newType,
      baseGame: newBaseGame,
      coverUrl: newCoverUrl,
    });

    // For DLC/Expansion, remove platform error and check if platforms selected
    if (isDlcOrExpansion) {
      delete errors.platformId;
      if (!hasSelectedPlatforms) {
        errors.baseGame = "Select at least one platform to create this content for.";
      }
    }

    setNewErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      // Build list of games to create
      const gamesToCreate: Array<{ platformId: string; baseGameIds: string[] }> = [];

      if (isDlcOrExpansion) {
        // Create for each selected sibling platform
        for (const siblingId of newAdditionalPlatformIds) {
          const sibling = baseGameSiblings.find((g: SearchableGame) => g.id === siblingId);
          if (sibling?.platform?.id) {
            gamesToCreate.push({
              platformId: sibling.platform.id,
              baseGameIds: [sibling.id],
            });
          }
        }
      } else {
        // Single platform creation (BASE_GAME)
        gamesToCreate.push({
          platformId: newPlatformId,
          baseGameIds: [],
        });
      }

      let successCount = 0;
      let lastCreatedTitle = "";

      for (const gameConfig of gamesToCreate) {
        const { data } = await createGame({
          variables: {
            input: {
              title: newTitle.trim(),
              description: newDescription.trim() || null,
              coverUrl: newCoverUrl.trim() || null,
              platformId: gameConfig.platformId,
              type: newType,
              baseGameIds: newType !== "BASE_GAME" ? gameConfig.baseGameIds : [],
            },
          },
        });

        const payload = data?.createGame;
        if (payload?.success) {
          successCount++;
          lastCreatedTitle = payload.game.title;
        }
      }

      setIsAddModalOpen(false);
      resetForm();
      refetch();

      if (successCount === 0) {
        toast.error("Failed to create game.");
      } else if (successCount === 1) {
        toast.success(`Created ${lastCreatedTitle}.`);
      } else {
        toast.success(`Created ${newTitle.trim()} for ${successCount} platforms.`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create game."
      );
    }
  };

  const openEditModal = (game: Game) => {
    setEditingGameId(game.id);
    setIsEditModalOpen(true);
  };

  const openCloneModal = (game: Game) => {
    setCloneGame(game);
    setIsCloneModalOpen(true);
  };

  const handleSingleDelete = async () => {
    if (!confirmState?.gameId) return;

    try {
      const { data } = await deleteGame({
        variables: { id: confirmState.gameId },
      });

      const payload = data?.deleteGame;
      if (!payload?.success) {
        toast.error(getMutationMessage(payload?.error));
        return;
      }

      await refetch();
      setConfirmState(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(confirmState.gameId!);
        return next;
      });
      toast.success("Game deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete game."
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      const { data } = await bulkDelete({
        variables: { ids: Array.from(selectedIds) },
      });

      const payload = data?.bulkDeleteGames;
      if (!payload?.success) {
        toast.error(getMutationMessage(payload?.error));
        return;
      }

      await refetch();
      setSelectedIds(new Set());
      setConfirmState(null);
      toast.success(`Deleted ${payload.deletedCount} game(s).`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete games."
      );
    }
  };

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
      setSelectedIds(new Set());
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, []);

  // Only show full-page spinner on initial load (no data and no search)
  const isInitialLoad = loading && adminGames.length === 0 && !debouncedSearch;

  if (isInitialLoad) {
    return <LoadingSpinner text="Loading games..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Games</h1>
          <p className={styles.sectionSubtitle}>Create and manage games.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setConfirmState({
                  kind: "bulk",
                  title: `Delete ${selectedIds.size} games?`,
                  description:
                    "Remove every selected game from this page. Related content may become orphaned if it depends on these entries.",
                })
              }
            >
              <Trash2 size={14} />
              Delete {selectedIds.size}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={`${styles.searchIcon} ${loading ? styles.searching : ""}`} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search games by title..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {loading && (
            <div className={styles.searchSpinner} />
          )}
        </div>
        <Button
          variant={groupByTitle ? "primary" : "outline"}
          size="sm"
          onClick={() => setGroupByTitle(!groupByTitle)}
          title="Group games by title"
        >
          <Layers size={16} />
          Group
        </Button>
        <Button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Game
        </Button>
      </div>

      {/* Type Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => {
            setTypeFilter(null);
            setCurrentPage(1);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            fontSize: 13,
            background: typeFilter === null ? "var(--nintendo-red)" : "var(--bg-secondary)",
            color: typeFilter === null ? "white" : "var(--text-secondary)",
            border: typeFilter === null ? "1px solid var(--nintendo-red)" : "1px solid var(--border-color)",
            borderRadius: "var(--border-radius)",
            cursor: "pointer",
          }}
        >
          <Filter size={14} />
          All Games
        </button>
        {Object.entries(GAME_TYPE_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setTypeFilter(value);
              setCurrentPage(1);
            }}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              background: typeFilter === value ? "var(--nintendo-red)" : "var(--bg-secondary)",
              color: typeFilter === value ? "white" : "var(--text-secondary)",
              border: typeFilter === value ? "1px solid var(--nintendo-red)" : "1px solid var(--border-color)",
              borderRadius: "var(--border-radius)",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add New Game</DialogTitle>
            <DialogDescription>
              Create a new game entry with complete relationship and media data.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5 py-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Identity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Core metadata used to identify and categorize the game.
                </p>
              </div>

              <FormField label="Game Title" required error={newErrors.title}>
                <Input
                  placeholder="Enter game title"
                  value={newTitle}
                  onChange={(event) => {
                    setNewTitle(event.target.value);
                    setNewErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  className={getFieldErrorClass(Boolean(newErrors.title))}
                  aria-invalid={Boolean(newErrors.title)}
                />
              </FormField>

              <div className={`grid gap-4 ${newType === "BASE_GAME" ? "sm:grid-cols-2" : ""}`}>
                {newType === "BASE_GAME" && (
                  <FormField label="Platform" required error={newErrors.platformId}>
                    <Select
                      value={newPlatformId}
                      onValueChange={(value) => {
                        setNewPlatformId(value || "");
                        setNewErrors((prev) => ({
                          ...prev,
                          platformId: undefined,
                        }));
                      }}
                    >
                      <SelectTrigger
                        className={getFieldErrorClass(Boolean(newErrors.platformId))}
                      >
                        <span>
                          {platforms.find((p: Platform) => p.id === newPlatformId)?.name || "Select a platform"}
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
                )}

                <FormField label="Type" required>
                  <Select
                    value={newType}
                    onValueChange={(value) => {
                      const nextType = value || "BASE_GAME";
                      setNewType(nextType);
                      if (nextType === "BASE_GAME") {
                        setNewBaseGame(null);
                        setNewAdditionalPlatformIds(new Set());
                        setNewErrors((prev) => ({
                          ...prev,
                          baseGame: undefined,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <span>{GAME_TYPE_LABELS[newType]}</span>
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

              {newType !== "BASE_GAME" && (
                <FormField
                  label="Based On"
                  required
                  hint={`Search the full catalog to link this ${GAME_TYPE_LABELS[newType].toLowerCase()} to its original game.`}
                  error={newErrors.baseGame}
                >
                  <GameSearchPicker
                    mode="single"
                    value={newBaseGame}
                    onChange={(value) => {
                      setNewBaseGame(value);
                      setNewAdditionalPlatformIds(new Set());
                      setNewErrors((prev) => ({ ...prev, baseGame: undefined }));
                    }}
                    placeholder="Search the full game catalog..."
                    filterOption={(game) => game.type === "BASE_GAME" || !game.type}
                    emptyText="No base games found."
                  />
                </FormField>
              )}

              {/* Multi-platform selection for DLC/Expansion */}
              {newType !== "BASE_GAME" && baseGameSiblings.length > 0 && (
                <FormField
                  label="Create for Platforms"
                  hint={`Select which platform versions to create this ${GAME_TYPE_LABELS[newType].toLowerCase()} for.`}
                >
                  <div className="flex flex-col gap-1.5">
                    {baseGameSiblings.map((game: SearchableGame) => (
                      <SelectableButton
                        key={game.id}
                        selected={newAdditionalPlatformIds.has(game.id)}
                        onClick={() => {
                          setNewAdditionalPlatformIds((prev) => {
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
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Details
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Supporting description and media for this record.
                </p>
              </div>

              <FormField label="Description">
                <Textarea
                  placeholder="Enter game description"
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  rows={4}
                />
              </FormField>

              <FormField
                label="Cover URL"
                hint="Use a direct image URL starting with http:// or https://."
                error={newErrors.coverUrl}
              >
                <Input
                  placeholder="https://example.com/cover.jpg"
                  value={newCoverUrl}
                  onChange={(event) => {
                    setNewCoverUrl(event.target.value);
                    setNewErrors((prev) => ({ ...prev, coverUrl: undefined }));
                  }}
                  className={getFieldErrorClass(Boolean(newErrors.coverUrl))}
                  aria-invalid={Boolean(newErrors.coverUrl)}
                />
              </FormField>

              {newCoverUrl.trim() && (
                <FormField label="Cover Preview">
                  <CoverPreview
                    url={newCoverUrl.trim()}
                    alt="New game cover preview"
                  />
                </FormField>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateGame} loading={creating}>
              {newType !== "BASE_GAME" && newAdditionalPlatformIds.size > 0
                ? `Create for ${newAdditionalPlatformIds.size} Platform${newAdditionalPlatformIds.size > 1 ? "s" : ""}`
                : "Create Game"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cloneGame && (
        <GameCloneModal
          gameFamilyId={cloneGame.gameFamilyId}
          gameTitle={cloneGame.title}
          currentPlatformId={cloneGame.platform?.id}
          open={isCloneModalOpen}
          onOpenChange={(open) => {
            setIsCloneModalOpen(open);
            if (!open) setCloneGame(null);
          }}
          onSuccess={() => refetch()}
        />
      )}

      {editingGameId && (
        <GameEditModal
          gameId={editingGameId}
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) setEditingGameId(null);
          }}
          onSuccess={() => refetch()}
          enableMultiPlatformCreation
        />
      )}

      {adminGames.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === adminGames.length && adminGames.length > 0}
            onChange={(event) => {
              if (event.target.checked) {
                setSelectedIds(new Set(adminGames.map((game: AdminGameItem) => game.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>
            Select all on this page ({adminGames.length})
          </span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {groupByTitle ? (
          <>
            {groupedGames.map((group) => (
              <div key={group.gameFamilyId}>
                {group.games.length === 1 ? (
                  <div
                    className={`${styles.itemCard} ${
                      selectedIds.has(group.games[0].id) ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.itemCheckbox}
                      checked={selectedIds.has(group.games[0].id)}
                      onChange={(event) => {
                        const next = new Set(selectedIds);
                        if (event.target.checked) next.add(group.games[0].id);
                        else next.delete(group.games[0].id);
                        setSelectedIds(next);
                      }}
                    />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>
                        {group.games[0].title}
                      </span>
                      <span className={styles.itemSlug}>
                        {group.games[0].platformName || "No platform"}
                      </span>
                      {group.games[0].type &&
                        group.games[0].type !== "BASE_GAME" && (
                          <span className={styles.badge}>
                            {GAME_TYPE_LABELS[group.games[0].type]}
                          </span>
                        )}
                    </div>
                    <span className={styles.itemMeta}>
                      {group.games[0].achievementSetCount} achievements
                    </span>
                    <div className={styles.itemActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openCloneModal(convertToGame(group.games[0]))}
                        title="Clone to platform"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditModal(convertToGame(group.games[0]))}
                        title="Edit game"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() =>
                          setConfirmState({
                            kind: "single",
                            gameId: group.games[0].id,
                            title: `Delete ${group.games[0].title}?`,
                            description:
                              "This will permanently remove the selected game record.",
                          })
                        }
                        title="Delete game"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className={`${styles.itemCard} ${styles.groupHeader}`}
                      onClick={() =>
                        setExpandedGroups((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.gameFamilyId)) next.delete(group.gameFamilyId);
                          else next.add(group.gameFamilyId);
                          return next;
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {expandedGroups.has(group.gameFamilyId) ? (
                          <ChevronDown
                            size={18}
                            style={{ color: "var(--text-muted)" }}
                          />
                        ) : (
                          <ChevronRight
                            size={18}
                            style={{ color: "var(--text-muted)" }}
                          />
                        )}
                      </div>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{group.title}</span>
                        <span className={styles.itemSlug}>
                          {group.games.length} platforms:{" "}
                          {group.games
                            .map((game) => game.platformName)
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                      <span className={styles.itemMeta}>
                        {group.totalAchievements} achievements total
                      </span>
                    </div>
                    {expandedGroups.has(group.gameFamilyId) && (
                      <div
                        style={{
                          marginLeft: 24,
                          borderLeft: "2px solid var(--border-color)",
                          paddingLeft: 8,
                        }}
                      >
                        {group.games.map((game) => (
                          <div
                            key={game.id}
                            className={`${styles.itemCard} ${
                              selectedIds.has(game.id) ? styles.selected : ""
                            }`}
                            style={{ marginTop: 4 }}
                          >
                            <input
                              type="checkbox"
                              className={styles.itemCheckbox}
                              checked={selectedIds.has(game.id)}
                              onChange={(event) => {
                                const next = new Set(selectedIds);
                                if (event.target.checked) next.add(game.id);
                                else next.delete(game.id);
                                setSelectedIds(next);
                              }}
                            />
                            <div className={styles.itemInfo}>
                              <span
                                className={styles.itemSlug}
                                style={{ fontWeight: 500 }}
                              >
                                {game.platformName || "No platform"}
                              </span>
                              {game.type && game.type !== "BASE_GAME" && (
                                <span className={styles.badge}>
                                  {GAME_TYPE_LABELS[game.type]}
                                </span>
                              )}
                            </div>
                            <span className={styles.itemMeta}>
                              {game.achievementSetCount} achievements
                            </span>
                            <div className={styles.itemActions}>
                              <button
                                className={styles.actionBtn}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openCloneModal(convertToGame(game));
                                }}
                                title="Clone to platform"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                className={styles.actionBtn}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditModal(convertToGame(game));
                                }}
                                title="Edit game"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.danger}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setConfirmState({
                                    kind: "single",
                                    gameId: game.id,
                                    title: `Delete ${game.title}?`,
                                    description: `This will permanently remove the ${game.platformName || "selected"} version of this game.`,
                                  });
                                }}
                                title="Delete game"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </>
        ) : (
          adminGames.map((game: AdminGameItem) => (
            <div
              key={game.id}
              className={`${styles.itemCard} ${
                selectedIds.has(game.id) ? styles.selected : ""
              }`}
            >
              <input
                type="checkbox"
                className={styles.itemCheckbox}
                checked={selectedIds.has(game.id)}
                onChange={(event) => {
                  const next = new Set(selectedIds);
                  if (event.target.checked) next.add(game.id);
                  else next.delete(game.id);
                  setSelectedIds(next);
                }}
              />
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{game.title}</span>
                <span className={styles.itemSlug}>
                  {game.platformName || "No platform"}
                </span>
                {game.type && game.type !== "BASE_GAME" && (
                  <span className={styles.badge}>
                    {GAME_TYPE_LABELS[game.type]}
                  </span>
                )}
              </div>
              <span className={styles.itemMeta}>
                {game.achievementSetCount} achievements
              </span>
              <div className={styles.itemActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => openCloneModal(convertToGame(game))}
                  title="Clone to platform"
                >
                  <Copy size={14} />
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => openEditModal(convertToGame(game))}
                  title="Edit game"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={() =>
                    setConfirmState({
                      kind: "single",
                      gameId: game.id,
                      title: `Delete ${game.title}?`,
                      description:
                        "This will permanently remove the selected game record.",
                    })
                  }
                  title="Delete game"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}

        {adminGames.length === 0 && !loading && (
          <p className={styles.emptyState}>
            {searchQuery
              ? `No games found matching "${searchQuery}"`
              : "No games yet. Click Add Game to create one."}
          </p>
        )}
      </div>

      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={loading}
        />
      )}

      <AdminConfirmDialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        title={confirmState?.title || "Confirm action"}
        description={confirmState?.description || ""}
        confirmLabel={confirmState?.kind === "bulk" ? "Delete Games" : "Delete Game"}
        loading={confirmState?.kind === "bulk" ? bulkDeleting : deleting}
        onConfirm={() => {
          if (confirmState?.kind === "bulk") {
            return handleBulkDelete();
          }
          return handleSingleDelete();
        }}
      />
    </div>
  );
}
