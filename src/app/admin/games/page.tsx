"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_GAMES_ADMIN, GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  CREATE_GAME,
  UPDATE_GAME,
  DELETE_GAME,
  BULK_DELETE_GAMES,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X, Plus, Search } from "lucide-react";
import { Button, LoadingSpinner, Pagination } from "@/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "../page.module.css";

interface Platform {
  id: string;
  name: string;
}

interface Game {
  id: string;
  title: string;
  slug: string;
  platform?: Platform | null;
  type?: string;
  achievementCount: number;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 20;

export default function AdminGamesPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPlatformId, setNewPlatformId] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSlug, setEditingSlug] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Map<number, string | null>>(
    new Map([[1, null]])
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
      setCursors(new Map([[1, null]]));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-generate slug from title
  useEffect(() => {
    if (newTitle && !newSlug) {
      setNewSlug(
        newTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }, [newTitle, newSlug]);

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

  const [createGame, { loading: creating }] = useMutation(CREATE_GAME, {
    onCompleted: () => {
      refetch();
      setCurrentPage(1);
      setCursors(new Map([[1, null]]));
      setIsAddModalOpen(false);
      resetForm();
    },
  });
  const [updateGame] = useMutation(UPDATE_GAME, {
    onCompleted: () => refetch(),
  });
  const [deleteGame] = useMutation(DELETE_GAME, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_GAMES, {
    onCompleted: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const platforms = platformsData?.platforms || [];
  const games =
    gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];
  const pageInfo: PageInfo = gamesData?.games?.pageInfo || {
    hasNextPage: false,
    endCursor: null,
  };
  const totalCount = gamesData?.games?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const resetForm = () => {
    setNewTitle("");
    setNewSlug("");
    setNewPlatformId("");
  };

  const handleCreateGame = async () => {
    if (!newTitle || !newSlug || !newPlatformId) return;
    await createGame({
      variables: {
        input: {
          title: newTitle,
          slug: newSlug,
          platformId: newPlatformId,
        },
      },
    });
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
              loading={bulkDeleting}
              onClick={async () => {
                if (confirm(`Delete ${selectedIds.size} game(s)?`)) {
                  await bulkDelete({ variables: { ids: Array.from(selectedIds) } });
                }
              }}
            >
              <Trash2 size={14} />
              Delete {selectedIds.size}
            </Button>
          )}
        </div>
      </div>

      {/* Search and Add Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search games by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Add Game
        </Button>
      </div>

      {/* Add Game Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Game</DialogTitle>
            <DialogDescription>
              Create a new game entry in the database.
            </DialogDescription>
          </DialogHeader>

          <div className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Game Title</label>
              <Input
                placeholder="Enter game title"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  // Auto-generate slug when title changes
                  setNewSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, "")
                  );
                }}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Slug</label>
              <Input
                placeholder="game-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
              <span className={styles.formHint}>
                URL-friendly identifier (auto-generated from title)
              </span>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Platform</label>
              <Select value={newPlatformId} onValueChange={(value) => setNewPlatformId(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p: Platform) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
            <Button
              onClick={handleCreateGame}
              loading={creating}
              disabled={!newTitle || !newSlug || !newPlatformId}
            >
              Create Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading && games.length === 0 ? (
        <LoadingSpinner text="Loading games..." />
      ) : (
        <>
          {games.length > 0 && (
            <div className={styles.selectAllBar}>
              <input
                type="checkbox"
                checked={selectedIds.size === games.length && games.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(new Set(games.map((g: Game) => g.id)));
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
            {games.map((game: Game) => (
              <div
                key={game.id}
                className={`${styles.itemCard} ${
                  selectedIds.has(game.id) ? styles.selected : ""
                }`}
              >
                {editingId === game.id ? (
                  <div className={styles.editForm}>
                    <input
                      className={styles.editInput}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      placeholder="Title"
                    />
                    <input
                      className={styles.editInput}
                      value={editingSlug}
                      onChange={(e) => setEditingSlug(e.target.value)}
                      placeholder="Slug"
                    />
                    <div className={styles.editActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={async () => {
                          await updateGame({
                            variables: {
                              id: game.id,
                              input: { title: editingTitle, slug: editingSlug },
                            },
                          });
                          setEditingId(null);
                        }}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setEditingId(null)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      className={styles.itemCheckbox}
                      checked={selectedIds.has(game.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(game.id);
                        else newSet.delete(game.id);
                        setSelectedIds(newSet);
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
                        onClick={() => {
                          setEditingId(game.id);
                          setEditingTitle(game.title);
                          setEditingSlug(game.slug);
                        }}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={async () => {
                          if (confirm(`Delete ${game.title}?`)) {
                            await deleteGame({ variables: { id: game.id } });
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
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
        </>
      )}
    </div>
  );
}
