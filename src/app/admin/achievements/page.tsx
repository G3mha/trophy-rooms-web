"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ACHIEVEMENT_SETS_ADMIN, GET_ACHIEVEMENTS_ADMIN } from "@/graphql/admin_queries";
import {
  CREATE_ACHIEVEMENT,
  UPDATE_ACHIEVEMENT,
  DELETE_ACHIEVEMENT,
  BULK_DELETE_ACHIEVEMENTS,
  BULK_CREATE_ACHIEVEMENTS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search, Upload } from "lucide-react";
import { Button, LoadingSpinner, Pagination } from "@/components";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "../page.module.css";

interface AchievementSet {
  id: string;
  title: string;
  game?: { title: string } | null;
}

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  points?: number | null;
  tier?: string | null;
  iconUrl?: string | null;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 20;

export default function AdminAchievementsPage() {
  // Filter state
  const [selectedSetId, setSelectedSetId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [newIconUrl, setNewIconUrl] = useState("");

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPoints, setEditPoints] = useState("");
  const [editIconUrl, setEditIconUrl] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [csvData, setCsvData] = useState("");

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

  const { data: setsData } = useQuery(GET_ACHIEVEMENT_SETS_ADMIN);

  const {
    data: achievementsData,
    loading,
    refetch,
  } = useQuery(GET_ACHIEVEMENTS_ADMIN, {
    variables: {
      first: pageSize,
      after: cursors.get(currentPage) || null,
      filter: selectedSetId ? { achievementSetId: selectedSetId } : undefined,
      orderBy: "TITLE_ASC",
    },
    skip: !selectedSetId,
  });

  const [createAchievement, { loading: creating }] = useMutation(CREATE_ACHIEVEMENT, {
    onCompleted: () => {
      refetch();
      setCurrentPage(1);
      setCursors(new Map([[1, null]]));
      setIsAddModalOpen(false);
      resetAddForm();
    },
  });

  const [updateAchievement, { loading: updating }] = useMutation(UPDATE_ACHIEVEMENT, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
    },
  });

  const [deleteAchievement] = useMutation(DELETE_ACHIEVEMENT, {
    onCompleted: () => refetch(),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_ACHIEVEMENTS, {
    onCompleted: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const [bulkCreate, { loading: importing }] = useMutation(BULK_CREATE_ACHIEVEMENTS, {
    onCompleted: () => {
      refetch();
      setCsvData("");
      setShowImport(false);
      setCurrentPage(1);
      setCursors(new Map([[1, null]]));
    },
  });

  const sets: AchievementSet[] = setsData?.achievementSets || [];
  const achievements: Achievement[] =
    achievementsData?.achievements?.edges?.map(
      (e: { node: Achievement }) => e.node
    ) || [];
  const pageInfo: PageInfo = achievementsData?.achievements?.pageInfo || {
    hasNextPage: false,
    endCursor: null,
  };
  const totalCount = achievementsData?.achievements?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Filter achievements by search (client-side for current page)
  const filteredAchievements = debouncedSearch
    ? achievements.filter(
        (a) =>
          a.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
      )
    : achievements;

  const resetAddForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewPoints("");
    setNewIconUrl("");
  };

  const resetEditForm = () => {
    setEditingAchievement(null);
    setEditTitle("");
    setEditDescription("");
    setEditPoints("");
    setEditIconUrl("");
  };

  const openEditModal = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setEditTitle(achievement.title);
    setEditDescription(achievement.description || "");
    setEditPoints(achievement.points?.toString() || "0");
    setEditIconUrl(achievement.iconUrl || "");
    setIsEditModalOpen(true);
  };

  const handleCreateAchievement = async () => {
    if (!newTitle || !selectedSetId) return;
    await createAchievement({
      variables: {
        input: {
          title: newTitle,
          description: newDescription || null,
          points: newPoints ? parseInt(newPoints) : 0,
          iconUrl: newIconUrl || null,
          achievementSetId: selectedSetId,
        },
      },
    });
  };

  const handleUpdateAchievement = async () => {
    if (!editingAchievement || !editTitle) return;
    await updateAchievement({
      variables: {
        id: editingAchievement.id,
        input: {
          title: editTitle,
          description: editDescription || null,
          points: editPoints ? parseInt(editPoints) : 0,
          iconUrl: editIconUrl || null,
        },
      },
    });
  };

  const handleImport = async () => {
    if (!csvData || !selectedSetId) return;
    const lines = csvData.trim().split("\n");
    const achievementsToCreate = lines.map((line) => {
      const [title, description, points] = line.split(",").map((s) => s.trim());
      return {
        title,
        description: description || null,
        points: points ? parseInt(points) : 0,
        achievementSetId: selectedSetId,
      };
    });
    await bulkCreate({ variables: { input: { achievements: achievementsToCreate } } });
  };

  const handleSetChange = (setId: string) => {
    setSelectedSetId(setId);
    setSelectedIds(new Set());
    setCurrentPage(1);
    setCursors(new Map([[1, null]]));
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

  const selectedSet = sets.find((s) => s.id === selectedSetId);

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Achievements</h1>
          <p className={styles.sectionSubtitle}>Manage individual achievements.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedSetId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowImport(!showImport)}
            >
              <Upload size={14} />
              Import CSV
            </Button>
          )}
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={bulkDeleting}
              onClick={async () => {
                if (confirm(`Delete ${selectedIds.size} achievement(s)?`)) {
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

      {/* Achievement Set Selector */}
      <div style={{ marginBottom: 20, maxWidth: 500 }}>
        <Select value={selectedSetId} onValueChange={handleSetChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select an achievement set..." />
          </SelectTrigger>
          <SelectContent>
            {sets.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title} ({s.game?.title || "No game"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Import CSV Section */}
      {showImport && selectedSetId && (
        <div
          style={{
            marginBottom: 20,
            padding: 16,
            background: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px solid var(--border-color)",
          }}
        >
          <p
            style={{
              marginBottom: 8,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Paste CSV data (title,description,points per line):
          </p>
          <Textarea
            style={{ width: "100%", minHeight: 100, marginBottom: 8 }}
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="Beat the game,Complete the main story,100&#10;Find all secrets,Discover every hidden item,50"
          />
          <div style={{ display: "flex", gap: 8 }}>
            <Button loading={importing} onClick={handleImport}>
              Import Achievements
            </Button>
            <Button variant="secondary" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {selectedSetId && (
        <>
          {/* Search and Add Bar */}
          <div className={styles.searchBar}>
            <div className={styles.searchInputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />
              Add Achievement
            </Button>
          </div>

          {/* Add Achievement Modal */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Add New Achievement</DialogTitle>
                <DialogDescription>
                  Create a new achievement for {selectedSet?.title || "this set"}.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className={styles.modalForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Title *</label>
                  <Input
                    placeholder="e.g. Beat the Game"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Description</label>
                  <Textarea
                    placeholder="e.g. Complete the main story"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Points</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Icon URL</label>
                  <Input
                    placeholder="https://example.com/icon.png"
                    value={newIconUrl}
                    onChange={(e) => setNewIconUrl(e.target.value)}
                  />
                </div>
              </DialogBody>

              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetAddForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAchievement}
                  loading={creating}
                  disabled={!newTitle}
                >
                  Create Achievement
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Achievement Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) resetEditForm();
          }}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Edit Achievement</DialogTitle>
                <DialogDescription>
                  Update achievement details.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className={styles.modalForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Title *</label>
                  <Input
                    placeholder="e.g. Beat the Game"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Description</label>
                  <Textarea
                    placeholder="e.g. Complete the main story"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Points</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Icon URL</label>
                  <Input
                    placeholder="https://example.com/icon.png"
                    value={editIconUrl}
                    onChange={(e) => setEditIconUrl(e.target.value)}
                  />
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
                <Button
                  onClick={handleUpdateAchievement}
                  loading={updating}
                  disabled={!editTitle}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loading ? (
            <LoadingSpinner text="Loading achievements..." />
          ) : (
            <>
              {/* Select All Bar */}
              {filteredAchievements.length > 0 && (
                <div className={styles.selectAllBar}>
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredAchievements.length &&
                      filteredAchievements.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(
                          new Set(filteredAchievements.map((a) => a.id))
                        );
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  <span className={styles.selectAllLabel}>
                    Select all on this page ({filteredAchievements.length})
                  </span>
                </div>
              )}

              {/* Achievements List */}
              <div className={styles.itemsGrid}>
                {filteredAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`${styles.itemCard} ${
                      selectedIds.has(achievement.id) ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.itemCheckbox}
                      checked={selectedIds.has(achievement.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(achievement.id);
                        else newSet.delete(achievement.id);
                        setSelectedIds(newSet);
                      }}
                    />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>
                        {achievement.title}
                      </span>
                      {achievement.description && (
                        <span className={styles.itemSlug} style={{ maxWidth: 300 }}>
                          {achievement.description}
                        </span>
                      )}
                    </div>
                    <span className={styles.itemMeta}>
                      {achievement.points || 0} pts
                    </span>
                    <div className={styles.itemActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditModal(achievement)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={async () => {
                          if (confirm(`Delete ${achievement.title}?`)) {
                            await deleteAchievement({
                              variables: { id: achievement.id },
                            });
                          }
                        }}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredAchievements.length === 0 && (
                  <p className={styles.emptyState}>
                    {searchQuery
                      ? `No achievements found matching "${searchQuery}"`
                      : "No achievements in this set yet. Click Add Achievement to create one."}
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
        </>
      )}

      {!selectedSetId && (
        <p className={styles.emptyState}>
          Select an achievement set above to manage its achievements.
        </p>
      )}
    </div>
  );
}
