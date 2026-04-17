"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_GAMES_ADMIN, GET_ACHIEVEMENT_SETS_ADMIN } from "@/graphql/admin_queries";
import {
  CREATE_ACHIEVEMENT_SET,
  UPDATE_ACHIEVEMENT_SET,
  DELETE_ACHIEVEMENT_SET,
  BULK_DELETE_ACHIEVEMENT_SETS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button, LoadingSpinner } from "@/components";
import { AdminConfirmDialog } from "@/components/admin";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { GameCombobox } from "@/components/ui/game-combobox";
import styles from "../page.module.css";

interface Game {
  id: string;
  title: string;
  coverUrl?: string | null;
  platform?: { name: string } | null;
}

interface AchievementSet {
  id: string;
  title: string;
  type: string;
  visibility: string;
  achievementCount: number;
  game?: { id: string; title: string } | null;
}

const SET_TYPE_LABELS: Record<string, string> = {
  OFFICIAL: "Official",
  COMPLETIONIST: "Completionist",
  CUSTOM: "Custom",
};

export default function AdminAchievementSetsPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("OFFICIAL");
  const [newGameId, setNewGameId] = useState("");

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<AchievementSet | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("OFFICIAL");
  const [editGameId, setEditGameId] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"single" | "bulk">("single");
  const [setToDelete, setSetToDelete] = useState<AchievementSet | null>(null);

  const { data: gamesData } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 500, orderBy: "TITLE_ASC" },
  });

  const {
    data: setsData,
    loading,
    refetch,
  } = useQuery(GET_ACHIEVEMENT_SETS_ADMIN);

  const [createSet, { loading: creating }] = useMutation(CREATE_ACHIEVEMENT_SET, {
    onCompleted: () => {
      refetch();
      setIsAddModalOpen(false);
      resetAddForm();
      toast.success("Achievement set created.");
    },
    onError: (error) => toast.error(error.message || "Failed to create achievement set."),
  });

  const [updateSet, { loading: updating }] = useMutation(UPDATE_ACHIEVEMENT_SET, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
      toast.success("Achievement set updated.");
    },
    onError: (error) => toast.error(error.message || "Failed to update achievement set."),
  });

  const [deleteSet] = useMutation(DELETE_ACHIEVEMENT_SET, {
    onCompleted: () => {
      refetch();
      toast.success("Achievement set deleted.");
    },
    onError: (error) => toast.error(error.message || "Failed to delete achievement set."),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_ACHIEVEMENT_SETS, {
    onCompleted: (data) => {
      refetch();
      setSelectedIds(new Set());
      toast.success(`Deleted ${data?.bulkDeleteAchievementSets?.deletedCount || 0} set(s).`);
    },
    onError: (error) => toast.error(error.message || "Failed to delete achievement sets."),
  });

  const games: Game[] = useMemo(
    () => gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [],
    [gamesData]
  );
  const sets: AchievementSet[] = useMemo(
    () => setsData?.achievementSets || [],
    [setsData]
  );
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) {
      return sets;
    }

    const query = searchQuery.toLowerCase();
    return sets.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.game?.title.toLowerCase().includes(query) ||
        s.type.toLowerCase().includes(query)
    );
  }, [searchQuery, sets]);

  const resetAddForm = () => {
    setNewTitle("");
    setNewType("OFFICIAL");
    setNewGameId("");
  };

  const resetEditForm = () => {
    setEditingSet(null);
    setEditTitle("");
    setEditType("OFFICIAL");
    setEditGameId("");
  };

  const openEditModal = (set: AchievementSet) => {
    setEditingSet(set);
    setEditTitle(set.title);
    setEditType(set.type);
    setEditGameId(set.game?.id || "");
    setIsEditModalOpen(true);
  };

  const handleCreateSet = async () => {
    if (!newTitle || !newGameId) return;
    await createSet({
      variables: {
        input: {
          title: newTitle,
          type: newType,
          gameId: newGameId,
        },
      },
    });
  };

  const handleUpdateSet = async () => {
    if (!editingSet || !editTitle) return;
    await updateSet({
      variables: {
        id: editingSet.id,
        input: {
          title: editTitle,
          type: editType,
          gameId: editGameId || null,
        },
      },
    });
  };

  const openDeleteConfirm = (set: AchievementSet) => {
    setSetToDelete(set);
    setConfirmAction("single");
    setConfirmOpen(true);
  };

  const openBulkDeleteConfirm = () => {
    setConfirmAction("bulk");
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmAction === "bulk") {
      await bulkDelete({ variables: { ids: Array.from(selectedIds) } });
    } else if (setToDelete) {
      await deleteSet({ variables: { id: setToDelete.id } });
    }
    setConfirmOpen(false);
    setSetToDelete(null);
  };

  if (loading && sets.length === 0) {
    return <LoadingSpinner text="Loading achievement sets..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Achievement Sets</h1>
          <p className={styles.sectionSubtitle}>Create and manage achievement sets for games.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={openBulkDeleteConfirm}
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
            placeholder="Search achievement sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Add Set
        </Button>
      </div>

      {/* Add Achievement Set Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[480px]" onEnterKeySubmit={handleCreateSet}>
          <DialogHeader>
            <DialogTitle>Add New Achievement Set</DialogTitle>
            <DialogDescription>
              Create a new achievement set for a game.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <FormField label="Title" required>
              <Input
                placeholder="e.g. Main Achievements"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </FormField>

            <FormField label="Type" required>
              <Select value={newType} onValueChange={(value) => value && setNewType(value)}>
                <SelectTrigger>
                  <span>{SET_TYPE_LABELS[newType] || "Select type"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFICIAL">Official</SelectItem>
                  <SelectItem value="COMPLETIONIST">Completionist</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Game" required>
              <GameCombobox
                games={games}
                value={newGameId}
                onChange={setNewGameId}
                placeholder="Search for a game..."
              />
            </FormField>
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
              onClick={handleCreateSet}
              loading={creating}
              disabled={!newTitle || !newGameId}
            >
              Create Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Achievement Set Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) resetEditForm();
      }}>
        <DialogContent className="sm:max-w-[480px]" onEnterKeySubmit={handleUpdateSet}>
          <DialogHeader>
            <DialogTitle>Edit Achievement Set</DialogTitle>
            <DialogDescription>
              Update achievement set details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <FormField label="Title" required>
              <Input
                placeholder="e.g. Main Achievements"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </FormField>

            <FormField label="Type" required>
              <Select value={editType} onValueChange={(value) => value && setEditType(value)}>
                <SelectTrigger>
                  <span>{SET_TYPE_LABELS[editType] || "Select type"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OFFICIAL">Official</SelectItem>
                  <SelectItem value="COMPLETIONIST">Completionist</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Game">
              <GameCombobox
                games={games}
                value={editGameId}
                onChange={setEditGameId}
                placeholder="Search for a game..."
              />
            </FormField>
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
              onClick={handleUpdateSet}
              loading={updating}
              disabled={!editTitle}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select All Bar */}
      {filteredSets.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === filteredSets.length && filteredSets.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(filteredSets.map((s) => s.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>Select all ({filteredSets.length})</span>
        </div>
      )}

      {/* Achievement Sets List */}
      <div className={styles.itemsGrid}>
        {filteredSets.map((set) => (
          <div
            key={set.id}
            className={`${styles.itemCard} ${selectedIds.has(set.id) ? styles.selected : ""}`}
          >
            <input
              type="checkbox"
              className={styles.itemCheckbox}
              checked={selectedIds.has(set.id)}
              onChange={(e) => {
                const newSet = new Set(selectedIds);
                if (e.target.checked) newSet.add(set.id);
                else newSet.delete(set.id);
                setSelectedIds(newSet);
              }}
            />
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{set.title}</span>
              <span className={styles.itemSlug}>{set.game?.title || "No game"}</span>
              <span className={`${styles.badge} ${styles.badgeCount}`}>
                {SET_TYPE_LABELS[set.type] || set.type}
              </span>
            </div>
            <span className={styles.itemMeta}>
              {set.achievementCount} {set.achievementCount === 1 ? "achievement" : "achievements"}
            </span>
            <div className={styles.itemActions}>
              <Link
                href={`/admin/achievements?setId=${set.id}`}
                className={styles.actionBtn}
                title="View Achievements"
              >
                <ExternalLink size={14} />
              </Link>
              <button
                className={styles.actionBtn}
                onClick={() => openEditModal(set)}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={() => openDeleteConfirm(set)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {filteredSets.length === 0 && !loading && (
          <p className={styles.emptyState}>
            {searchQuery
              ? `No achievement sets found matching "${searchQuery}"`
              : "No achievement sets yet. Click Add Set to create one."}
          </p>
        )}
      </div>

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmDelete}
        loading={bulkDeleting}
        title={
          confirmAction === "bulk"
            ? `Delete ${selectedIds.size} set(s)?`
            : `Delete ${setToDelete?.title}?`
        }
        description={
          confirmAction === "bulk"
            ? "All selected achievement sets and their achievements will be permanently deleted."
            : "This achievement set and all its achievements will be permanently deleted."
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
