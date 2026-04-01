"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_GAMES_ADMIN, GET_ACHIEVEMENT_SETS_ADMIN } from "@/graphql/admin_queries";
import {
  CREATE_ACHIEVEMENT_SET,
  UPDATE_ACHIEVEMENT_SET,
  DELETE_ACHIEVEMENT_SET,
  BULK_DELETE_ACHIEVEMENT_SETS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
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
  const [filteredSets, setFilteredSets] = useState<AchievementSet[]>([]);

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
    },
  });

  const [updateSet, { loading: updating }] = useMutation(UPDATE_ACHIEVEMENT_SET, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
    },
  });

  const [deleteSet] = useMutation(DELETE_ACHIEVEMENT_SET, {
    onCompleted: () => refetch(),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_ACHIEVEMENT_SETS, {
    onCompleted: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const games: Game[] = gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];
  const sets: AchievementSet[] = setsData?.achievementSets || [];

  // Filter sets based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSets(sets);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSets(
        sets.filter(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.game?.title.toLowerCase().includes(query) ||
            s.type.toLowerCase().includes(query)
        )
      );
    }
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
              loading={bulkDeleting}
              onClick={async () => {
                if (confirm(`Delete ${selectedIds.size} set(s)?`)) {
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Achievement Set</DialogTitle>
            <DialogDescription>
              Create a new achievement set for a game.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Title *</label>
              <Input
                placeholder="e.g. Main Achievements"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Type *</label>
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
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Game *</label>
              <GameCombobox
                games={games}
                value={newGameId}
                onChange={setNewGameId}
                placeholder="Search for a game..."
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Achievement Set</DialogTitle>
            <DialogDescription>
              Update achievement set details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Title *</label>
              <Input
                placeholder="e.g. Main Achievements"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Type *</label>
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
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Game</label>
              <GameCombobox
                games={games}
                value={editGameId}
                onChange={setEditGameId}
                placeholder="Search for a game..."
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
              <button
                className={styles.actionBtn}
                onClick={() => openEditModal(set)}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={async () => {
                  if (confirm(`Delete ${set.title}?`)) {
                    await deleteSet({ variables: { id: set.id } });
                  }
                }}
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
    </div>
  );
}
