"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_GAMES_ADMIN, GET_ACHIEVEMENT_SETS_ADMIN } from "@/graphql/admin_queries";
import {
  CREATE_ACHIEVEMENT_SET,
  UPDATE_ACHIEVEMENT_SET,
  SET_ACHIEVEMENT_SET_TYPE,
  DELETE_ACHIEVEMENT_SET,
  BULK_DELETE_ACHIEVEMENT_SETS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button, PageSkeleton } from "@/components";
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
import { getMutationMessage } from "@/lib/mutation-utils";

interface Game {
  id: string;
  gameFamilyId?: string | null;
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
  gameFamily?: { id: string; title: string } | null;
}

const SET_TYPE_LABELS: Record<string, string> = {
  OFFICIAL: "Official",
  COMPLETIONIST: "Completionist",
  CUSTOM: "Custom",
};

export default function AdminAchievementSetsPage() {
  // Search state
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") ?? "");
  // Set by the admin toolbar's "Manage Trophies" to show one game's lists only
  const familyId = searchParams.get("familyId");
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
    onCompleted: (data) => {
      const payload = data?.createAchievementSet;
      if (!payload?.success) {
        toast.error(getMutationMessage(payload?.error));
        return;
      }
      refetch();
      setIsAddModalOpen(false);
      resetAddForm();
      toast.success("Trophy list created.");
    },
    onError: (error) => toast.error(error.message || "Failed to create trophy list."),
  });

  const [updateSet, { loading: updatingTitle }] = useMutation(UPDATE_ACHIEVEMENT_SET);
  const [setSetType, { loading: updatingType }] = useMutation(SET_ACHIEVEMENT_SET_TYPE);
  const updating = updatingTitle || updatingType;

  const [deleteSet] = useMutation(DELETE_ACHIEVEMENT_SET, {
    onCompleted: (data) => {
      const payload = data?.deleteAchievementSet;
      if (!payload?.success) {
        toast.error(getMutationMessage(payload?.error));
        return;
      }
      refetch();
      toast.success("Trophy list deleted.");
    },
    onError: (error) => toast.error(error.message || "Failed to delete trophy list."),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_ACHIEVEMENT_SETS, {
    onCompleted: (data) => {
      const payload = data?.bulkDeleteAchievementSets;
      if (!payload?.success) {
        toast.error(getMutationMessage(payload?.error));
        return;
      }
      refetch();
      setSelectedIds(new Set());
      const count = payload.deletedCount || 0;
      toast.success(`Deleted ${count} ${count === 1 ? "trophy list" : "trophy lists"}.`);
    },
    onError: (error) => toast.error(error.message || "Failed to delete trophy lists."),
  });

  const games: Game[] = useMemo(
    () => gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [],
    [gamesData]
  );
  const sets: AchievementSet[] = useMemo(
    () => setsData?.achievementSets || [],
    [setsData]
  );
  const familySets = useMemo(
    () => (familyId ? sets.filter((s) => s.gameFamily?.id === familyId) : sets),
    [familyId, sets]
  );
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) {
      return familySets;
    }

    const query = searchQuery.toLowerCase();
    return familySets.filter(
      (s) =>
        s.title.toLowerCase().includes(query) ||
        s.gameFamily?.title.toLowerCase().includes(query) ||
        s.type.toLowerCase().includes(query)
    );
  }, [searchQuery, familySets]);

  const resetAddForm = () => {
    setNewTitle("");
    setNewType("OFFICIAL");
    setNewGameId("");
  };

  const resetEditForm = () => {
    setEditingSet(null);
    setEditTitle("");
    setEditType("OFFICIAL");
  };

  const openEditModal = (set: AchievementSet) => {
    setEditingSet(set);
    setEditTitle(set.title);
    setEditType(set.type);
    setIsEditModalOpen(true);
  };

  const handleCreateSet = async () => {
    if (!newTitle || !newGameId) return;
    // Sets belong to the game family; the picker lists per-platform games
    const gameFamilyId = games.find((g) => g.id === newGameId)?.gameFamilyId;
    if (!gameFamilyId) {
      toast.error("This game isn't linked to a game family yet.");
      return;
    }
    await createSet({
      variables: {
        input: {
          title: newTitle,
          type: newType,
          gameFamilyId,
        },
      },
    });
  };

  const handleUpdateSet = async () => {
    if (!editingSet || !editTitle) return;
    try {
      // updateAchievementSet only takes title and visibility; type has its own mutation
      const { data } = await updateSet({
        variables: { id: editingSet.id, input: { title: editTitle } },
      });
      if (!data?.updateAchievementSet.success) {
        toast.error(data?.updateAchievementSet.error?.message || "Failed to update trophy list.");
        return;
      }

      if (editType !== editingSet.type) {
        const { data: typeData } = await setSetType({
          variables: { id: editingSet.id, type: editType },
        });
        if (!typeData?.setAchievementSetType.success) {
          refetch();
          toast.error(typeData?.setAchievementSetType.error?.message || "Failed to change list type.");
          return;
        }
      }

      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
      toast.success("Trophy list updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update trophy list.");
    }
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
    return <PageSkeleton variant="rows" label="Loading trophy lists" />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Trophy Lists</h1>
          <p className={styles.sectionSubtitle}>Create and manage trophy lists for games.</p>
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
            placeholder="Search trophy lists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Add List
        </Button>
      </div>

      {familyId && (
        <p className={styles.sectionSubtitle} style={{ margin: "-8px 0 16px" }}>
          Showing lists for {familySets[0]?.gameFamily?.title || "this game"}.{" "}
          <Link href="/admin/trophy-lists" style={{ textDecoration: "underline" }}>
            Show all
          </Link>
        </p>
      )}

      {/* Add Trophy List Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[480px]" onEnterKeySubmit={handleCreateSet}>
          <DialogHeader>
            <DialogTitle>Add New Trophy List</DialogTitle>
            <DialogDescription>
              Create a new trophy list for a game.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <FormField label="Title" required>
              <Input
                placeholder="e.g. Main Trophies"
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
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Trophy List Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) resetEditForm();
      }}>
        <DialogContent className="sm:max-w-[480px]" onEnterKeySubmit={handleUpdateSet}>
          <DialogHeader>
            <DialogTitle>Edit Trophy List</DialogTitle>
            <DialogDescription>
              Update trophy list details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <FormField label="Title" required>
              <Input
                placeholder="e.g. Main Trophies"
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

      {/* Trophy lists */}
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
              <span className={styles.itemSlug}>{set.gameFamily?.title || "No game"}</span>
              <span className={`${styles.badge} ${styles.badgeCount}`}>
                {SET_TYPE_LABELS[set.type] || set.type}
              </span>
            </div>
            <span className={styles.itemMeta}>
              {set.achievementCount} {set.achievementCount === 1 ? "trophy" : "trophies"}
            </span>
            <div className={styles.itemActions}>
              <Link
                href={`/admin/trophies?setId=${set.id}`}
                className={styles.actionBtn}
                title="View Trophies"
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
              ? `No trophy lists found matching "${searchQuery}"`
              : "No trophy lists yet. Click Add List to create one."}
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
            ? `Delete ${selectedIds.size} ${selectedIds.size === 1 ? "trophy list" : "trophy lists"}?`
            : `Delete ${setToDelete?.title}?`
        }
        description={
          confirmAction === "bulk"
            ? `The selected ${selectedIds.size === 1 ? "trophy list and all its trophies" : "trophy lists and all their trophies"} will be permanently deleted.`
            : "This trophy list and all its trophies will be permanently deleted."
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
