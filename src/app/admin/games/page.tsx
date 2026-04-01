"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  AdminConfirmDialog,
  AdminFeedback,
  CoverPreview,
  GameSearchPicker,
  type SearchableGame,
} from "@/components/admin";
import { Button, LoadingSpinner, Pagination } from "@/components";
import { GET_GAMES_ADMIN, GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  BULK_DELETE_GAMES,
  CLONE_GAME_TO_PLATFORM,
  CREATE_GAME,
  DELETE_GAME,
  UPDATE_GAME,
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

interface Game {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  platform?: Platform | null;
  type?: string | null;
  baseGame?: SearchableGame | null;
  achievementCount: number;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

interface FeedbackState {
  tone: "success" | "error" | "info";
  message: string;
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

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getMutationMessage(error?: { message?: string | null } | null) {
  return error?.message || "Something went wrong. Please try again.";
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

export default function AdminGamesPage() {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newPlatformId, setNewPlatformId] = useState("");
  const [newType, setNewType] = useState("BASE_GAME");
  const [newBaseGame, setNewBaseGame] = useState<SearchableGame | null>(null);
  const [newErrors, setNewErrors] = useState<GameFormErrors>({});

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editPlatformId, setEditPlatformId] = useState("");
  const [editType, setEditType] = useState("BASE_GAME");
  const [editBaseGame, setEditBaseGame] = useState<SearchableGame | null>(null);
  const [editErrors, setEditErrors] = useState<GameFormErrors>({});

  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneGameId, setCloneGameId] = useState<string | null>(null);
  const [cloneGameTitle, setCloneGameTitle] = useState("");
  const [cloneSourcePlatformId, setCloneSourcePlatformId] = useState("");
  const [cloneTargetPlatformId, setCloneTargetPlatformId] = useState("");
  const [cloneCopyAchievements, setCloneCopyAchievements] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const [groupByTitle, setGroupByTitle] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Map<number, string | null>>(
    new Map([[1, null]])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
      setCursors(new Map([[1, null]]));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const {
    data: gamesData,
    loading,
    refetch,
  } = useQuery(GET_GAMES_ADMIN, {
    variables: {
      first: pageSize,
      after: cursors.get(currentPage) || null,
      orderBy: "TITLE_ASC",
      search: debouncedSearch || undefined,
    },
  });

  const [createGame, { loading: creating }] = useMutation(CREATE_GAME);
  const [updateGame, { loading: updating }] = useMutation(UPDATE_GAME);
  const [deleteGame, { loading: deleting }] = useMutation(DELETE_GAME);
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_GAMES);
  const [cloneGame, { loading: cloning }] = useMutation(CLONE_GAME_TO_PLATFORM);

  const platforms = useMemo(() => platformsData?.platforms || [], [platformsData]);
  const games = useMemo<Game[]>(
    () => gamesData?.games?.edges?.map((edge: { node: Game }) => edge.node) || [],
    [gamesData]
  );
  const pageInfo: PageInfo = gamesData?.games?.pageInfo || {
    hasNextPage: false,
    endCursor: null,
  };
  const totalCount = gamesData?.games?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const groupedGames = useMemo(() => {
    if (!groupByTitle) return [];

    const groups = new Map<string, Game[]>();
    games.forEach((game: Game) => {
      const existing = groups.get(game.title) || [];
      existing.push(game);
      groups.set(game.title, existing);
    });

    return Array.from(groups.entries()).map(([title, gameList]) => ({
      title,
      games: gameList,
      totalAchievements: gameList.reduce(
        (sum, game) => sum + game.achievementCount,
        0
      ),
    }));
  }, [games, groupByTitle]);

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewCoverUrl("");
    setNewPlatformId("");
    setNewType("BASE_GAME");
    setNewBaseGame(null);
    setNewErrors({});
  };

  const resetEditForm = () => {
    setEditingGame(null);
    setEditTitle("");
    setEditDescription("");
    setEditCoverUrl("");
    setEditPlatformId("");
    setEditType("BASE_GAME");
    setEditBaseGame(null);
    setEditErrors({});
  };

  const resetCloneForm = () => {
    setCloneGameId(null);
    setCloneGameTitle("");
    setCloneSourcePlatformId("");
    setCloneTargetPlatformId("");
    setCloneCopyAchievements(false);
    setCloneError(null);
  };

  const handleMutationFailure = (
    message: string,
    setErrors?: (errors: GameFormErrors) => void,
    field?: string | null
  ) => {
    setFeedback({ tone: "error", message });

    if (!setErrors || !field) return;

    if (field === "title") {
      setErrors({ title: message });
    } else if (field === "platformId") {
      setErrors({ platformId: message });
    } else if (field === "coverUrl") {
      setErrors({ coverUrl: message });
    } else if (field === "baseGameId") {
      setErrors({ baseGame: message });
    }
  };

  const handleCreateGame = async () => {
    const errors = validateGameForm({
      title: newTitle,
      platformId: newPlatformId,
      type: newType,
      baseGame: newBaseGame,
      coverUrl: newCoverUrl,
    });

    setNewErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFeedback(null);

    try {
      const { data } = await createGame({
        variables: {
          input: {
            title: newTitle.trim(),
            description: newDescription.trim() || null,
            coverUrl: newCoverUrl.trim() || null,
            platformId: newPlatformId,
            type: newType,
            baseGameId: newType !== "BASE_GAME" ? newBaseGame?.id || null : null,
          },
        },
      });

      const payload = data?.createGame;
      if (!payload?.success) {
        handleMutationFailure(
          getMutationMessage(payload?.error),
          setNewErrors,
          payload?.error?.field
        );
        return;
      }

      await refetch();
      setIsAddModalOpen(false);
      resetForm();
      setFeedback({
        tone: "success",
        message: `Created ${payload.game.title}.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to create game.",
      });
    }
  };

  const handleUpdateGame = async () => {
    if (!editingGame) return;

    const errors = validateGameForm({
      title: editTitle,
      platformId: editPlatformId,
      type: editType,
      baseGame: editBaseGame,
      coverUrl: editCoverUrl,
    });

    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFeedback(null);

    try {
      const { data } = await updateGame({
        variables: {
          id: editingGame.id,
          input: {
            title: editTitle.trim(),
            description: editDescription.trim() || null,
            coverUrl: editCoverUrl.trim() || null,
            platformId: editPlatformId,
            type: editType,
            baseGameId: editType !== "BASE_GAME" ? editBaseGame?.id || null : null,
          },
        },
      });

      const payload = data?.updateGame;
      if (!payload?.success) {
        handleMutationFailure(
          getMutationMessage(payload?.error),
          setEditErrors,
          payload?.error?.field
        );
        return;
      }

      await refetch();
      setIsEditModalOpen(false);
      resetEditForm();
      setFeedback({
        tone: "success",
        message: `Saved changes to ${payload.game.title}.`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to update game.",
      });
    }
  };

  const handleCloneGame = async () => {
    if (!cloneGameId || !cloneTargetPlatformId) {
      setCloneError("Select a target platform.");
      return;
    }

    if (cloneTargetPlatformId === cloneSourcePlatformId) {
      setCloneError("Choose a different platform from the source platform.");
      return;
    }

    setCloneError(null);
    setFeedback(null);

    try {
      const { data } = await cloneGame({
        variables: {
          gameId: cloneGameId,
          targetPlatformId: cloneTargetPlatformId,
          copyAchievementSets: cloneCopyAchievements,
        },
      });

      const payload = data?.cloneGameToPlatform;
      if (!payload?.success) {
        setCloneError(getMutationMessage(payload?.error));
        return;
      }

      await refetch();
      setIsCloneModalOpen(false);
      resetCloneForm();
      setFeedback({
        tone: "success",
        message: `Cloned ${cloneGameTitle} to the selected platform.`,
      });
    } catch (error) {
      setCloneError(
        error instanceof Error ? error.message : "Unable to clone game."
      );
    }
  };

  const openEditModal = (game: Game) => {
    setFeedback(null);
    setEditingGame(game);
    setEditTitle(game.title);
    setEditDescription(game.description || "");
    setEditCoverUrl(game.coverUrl || "");
    setEditPlatformId(game.platform?.id || "");
    setEditType(game.type || "BASE_GAME");
    setEditBaseGame(game.baseGame || null);
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const openCloneModal = (game: Game) => {
    setFeedback(null);
    setCloneGameId(game.id);
    setCloneGameTitle(game.title);
    setCloneSourcePlatformId(game.platform?.id || "");
    setCloneTargetPlatformId("");
    setCloneCopyAchievements(false);
    setCloneError(null);
    setIsCloneModalOpen(true);
  };

  const handleSingleDelete = async () => {
    if (!confirmState?.gameId) return;

    setFeedback(null);

    try {
      const { data } = await deleteGame({
        variables: { id: confirmState.gameId },
      });

      const payload = data?.deleteGame;
      if (!payload?.success) {
        setFeedback({
          tone: "error",
          message: getMutationMessage(payload?.error),
        });
        return;
      }

      await refetch();
      setConfirmState(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(confirmState.gameId!);
        return next;
      });
      setFeedback({ tone: "success", message: "Game deleted." });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to delete game.",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setFeedback(null);

    try {
      const { data } = await bulkDelete({
        variables: { ids: Array.from(selectedIds) },
      });

      const payload = data?.bulkDeleteGames;
      if (!payload?.success) {
        setFeedback({
          tone: "error",
          message: getMutationMessage(payload?.error),
        });
        return;
      }

      await refetch();
      setSelectedIds(new Set());
      setConfirmState(null);
      setFeedback({
        tone: "success",
        message: `Deleted ${payload.deletedCount} game(s).`,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to delete games.",
      });
    }
  };

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;

      if (page === currentPage + 1 && pageInfo.endCursor) {
        setCursors((prev) => new Map(prev).set(page, pageInfo.endCursor));
      }

      if (page === 1) {
        setCursors(new Map([[1, null]]));
      }

      setCurrentPage(page);
      setSelectedIds(new Set());
    },
    [currentPage, pageInfo.endCursor, totalPages]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setCursors(new Map([[1, null]]));
    setSelectedIds(new Set());
  }, []);

  if (loading && games.length === 0) {
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

      {feedback && (
        <AdminFeedback tone={feedback.tone} message={feedback.message} />
      )}

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search games by title..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
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
            setFeedback(null);
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Game
        </Button>
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

          <DialogBody className={styles.modalForm}>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Identity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Core metadata used to identify and categorize the game.
                </p>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Game Title *</label>
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
                {renderFieldError(newErrors.title)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Platform *</label>
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
                  {renderFieldError(newErrors.platformId)}
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Type *</label>
                  <Select
                    value={newType}
                    onValueChange={(value) => {
                      const nextType = value || "BASE_GAME";
                      setNewType(nextType);
                      if (nextType === "BASE_GAME") {
                        setNewBaseGame(null);
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
                </div>
              </div>

              {newType !== "BASE_GAME" && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Based On *</label>
                  <GameSearchPicker
                    mode="single"
                    value={newBaseGame}
                    onChange={(value) => {
                      setNewBaseGame(value);
                      setNewErrors((prev) => ({ ...prev, baseGame: undefined }));
                    }}
                    placeholder="Search the full game catalog..."
                    filterOption={(game) => game.type === "BASE_GAME" || !game.type}
                    emptyText="No base games found."
                  />
                  <span className={styles.formHint}>
                    Search the full catalog to link this{" "}
                    {GAME_TYPE_LABELS[newType].toLowerCase()} to its original game.
                  </span>
                  {renderFieldError(newErrors.baseGame)}
                </div>
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

              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <Textarea
                  placeholder="Enter game description"
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  rows={4}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Cover URL</label>
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
                <span className={styles.formHint}>
                  Use a direct image URL starting with http:// or https://.
                </span>
                {renderFieldError(newErrors.coverUrl)}
              </div>

              {newCoverUrl.trim() && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Cover Preview</label>
                  <CoverPreview
                    url={newCoverUrl.trim()}
                    alt="New game cover preview"
                  />
                </div>
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
              Create Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCloneModalOpen}
        onOpenChange={(open) => {
          setIsCloneModalOpen(open);
          if (!open) resetCloneForm();
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Clone to Platform</DialogTitle>
            <DialogDescription>
              Create a copy of &quot;{cloneGameTitle}&quot; on another platform.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Target Platform *</label>
              <Select
                value={cloneTargetPlatformId}
                onValueChange={(value) => {
                  setCloneTargetPlatformId(value || "");
                  setCloneError(null);
                }}
              >
                <SelectTrigger
                  className={getFieldErrorClass(Boolean(cloneError))}
                >
                  <span>
                    {platforms.find((p: Platform) => p.id === cloneTargetPlatformId)?.name || "Select target platform"}
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
              {cloneError && (
                <span className="text-sm text-red-300">{cloneError}</span>
              )}
            </div>

            <div className={styles.formField}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={cloneCopyAchievements}
                  onChange={(event) =>
                    setCloneCopyAchievements(event.target.checked)
                  }
                />
                <span>Copy achievement sets</span>
              </label>
              <span className={styles.formHint}>
                Copy the related achievement sets and achievements into the new
                game record.
              </span>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsCloneModalOpen(false);
                resetCloneForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCloneGame} loading={cloning}>
              Clone Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) resetEditForm();
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update identity, relationships, and media without losing your place
              in the list.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Identity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Core metadata used to identify and categorize the game.
                </p>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Game Title *</label>
                <Input
                  placeholder="Enter game title"
                  value={editTitle}
                  onChange={(event) => {
                    setEditTitle(event.target.value);
                    setEditErrors((prev) => ({ ...prev, title: undefined }));
                  }}
                  className={getFieldErrorClass(Boolean(editErrors.title))}
                  aria-invalid={Boolean(editErrors.title)}
                />
                {renderFieldError(editErrors.title)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Platform *</label>
                  <Select
                    value={editPlatformId}
                    onValueChange={(value) => {
                      setEditPlatformId(value || "");
                      setEditErrors((prev) => ({
                        ...prev,
                        platformId: undefined,
                      }));
                    }}
                  >
                    <SelectTrigger
                      className={getFieldErrorClass(Boolean(editErrors.platformId))}
                    >
                      <span>
                        {platforms.find((p: Platform) => p.id === editPlatformId)?.name || "Select a platform"}
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
                  {renderFieldError(editErrors.platformId)}
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Type *</label>
                  <Select
                    value={editType}
                    onValueChange={(value) => {
                      const nextType = value || "BASE_GAME";
                      setEditType(nextType);
                      if (nextType === "BASE_GAME") {
                        setEditBaseGame(null);
                        setEditErrors((prev) => ({
                          ...prev,
                          baseGame: undefined,
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <span>{GAME_TYPE_LABELS[editType]}</span>
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

              {editType !== "BASE_GAME" && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Based On *</label>
                  <GameSearchPicker
                    mode="single"
                    value={editBaseGame}
                    onChange={(value) => {
                      setEditBaseGame(value);
                      setEditErrors((prev) => ({ ...prev, baseGame: undefined }));
                    }}
                    placeholder="Search the full game catalog..."
                    excludeIds={editingGame ? [editingGame.id] : []}
                    filterOption={(game) => game.type === "BASE_GAME" || !game.type}
                    emptyText="No base games found."
                  />
                  <span className={styles.formHint}>
                    Search the full catalog to link this{" "}
                    {GAME_TYPE_LABELS[editType].toLowerCase()} to its original
                    game.
                  </span>
                  {renderFieldError(editErrors.baseGame)}
                </div>
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

              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <Textarea
                  placeholder="Enter game description"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={4}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Cover URL</label>
                <Input
                  placeholder="https://example.com/cover.jpg"
                  value={editCoverUrl}
                  onChange={(event) => {
                    setEditCoverUrl(event.target.value);
                    setEditErrors((prev) => ({ ...prev, coverUrl: undefined }));
                  }}
                  className={getFieldErrorClass(Boolean(editErrors.coverUrl))}
                  aria-invalid={Boolean(editErrors.coverUrl)}
                />
                <span className={styles.formHint}>
                  Use a direct image URL starting with http:// or https://.
                </span>
                {renderFieldError(editErrors.coverUrl)}
              </div>

              {editCoverUrl.trim() && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Cover Preview</label>
                  <CoverPreview
                    url={editCoverUrl.trim()}
                    alt="Edited game cover preview"
                  />
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                resetEditForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateGame} loading={updating}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {games.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === games.length && games.length > 0}
            onChange={(event) => {
              if (event.target.checked) {
                setSelectedIds(new Set(games.map((game: Game) => game.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>
            Select all on this page ({games.length})
          </span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {groupByTitle ? (
          <>
            {groupedGames.map((group) => (
              <div key={group.title}>
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
                        {group.games[0].platform?.name || "No platform"}
                      </span>
                      {group.games[0].type &&
                        group.games[0].type !== "BASE_GAME" && (
                          <span className={styles.badge}>
                            {group.games[0].type.replace("_", " ")}
                          </span>
                        )}
                    </div>
                    <span className={styles.itemMeta}>
                      {group.games[0].achievementCount} achievements
                    </span>
                    <div className={styles.itemActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openCloneModal(group.games[0])}
                        title="Clone to platform"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditModal(group.games[0])}
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
                          if (next.has(group.title)) next.delete(group.title);
                          else next.add(group.title);
                          return next;
                        })
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {expandedGroups.has(group.title) ? (
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
                            .map((game) => game.platform?.name)
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                      <span className={styles.itemMeta}>
                        {group.totalAchievements} achievements total
                      </span>
                    </div>
                    {expandedGroups.has(group.title) && (
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
                                {game.platform?.name || "No platform"}
                              </span>
                              {game.type && game.type !== "BASE_GAME" && (
                                <span className={styles.badge}>
                                  {game.type.replace("_", " ")}
                                </span>
                              )}
                            </div>
                            <span className={styles.itemMeta}>
                              {game.achievementCount} achievements
                            </span>
                            <div className={styles.itemActions}>
                              <button
                                className={styles.actionBtn}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openCloneModal(game);
                                }}
                                title="Clone to platform"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                className={styles.actionBtn}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditModal(game);
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
                                    description: `This will permanently remove the ${game.platform?.name || "selected"} version of this game.`,
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
          games.map((game: Game) => (
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
                  {game.platform?.name || "No platform"}
                </span>
                {game.type && game.type !== "BASE_GAME" && (
                  <span className={styles.badge}>
                    {game.type.replace("_", " ")}
                  </span>
                )}
              </div>
              <span className={styles.itemMeta}>
                {game.achievementCount} achievements
              </span>
              <div className={styles.itemActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => openCloneModal(game)}
                  title="Clone to platform"
                >
                  <Copy size={14} />
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => openEditModal(game)}
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

        {games.length === 0 && !loading && (
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
