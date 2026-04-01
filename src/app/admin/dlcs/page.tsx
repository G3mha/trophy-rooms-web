"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DLCS } from "@/graphql/admin_queries";
import {
  CREATE_DLC,
  UPDATE_DLC,
  DELETE_DLC,
  BULK_DELETE_DLCS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search, Puzzle } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import {
  AdminConfirmDialog,
  GameSearchPicker,
  type SearchableGame,
} from "@/components/admin";
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
import styles from "../page.module.css";

interface DLC {
  id: string;
  name: string;
  slug: string;
  type: string;
  game?: { id: string; title: string } | null;
}

const DLC_TYPE_LABELS: Record<string, string> = {
  DLC: "DLC",
  EXPANSION: "Expansion",
  FREE_UPDATE: "Free Update",
};

export default function AdminDLCsPage() {
  // Game filter state
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedGame, setSelectedGame] = useState<SearchableGame | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDLCs, setFilteredDLCs] = useState<DLC[]>([]);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("DLC");

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDLC, setEditingDLC] = useState<DLC | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editType, setEditType] = useState("DLC");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"single" | "bulk">("single");
  const [dlcToDelete, setDlcToDelete] = useState<DLC | null>(null);

  const {
    data: dlcsData,
    loading,
    refetch,
  } = useQuery(GET_DLCS, {
    variables: { gameId: selectedGameId },
    skip: !selectedGameId,
  });

  const [createDLC, { loading: creating }] = useMutation(CREATE_DLC, {
    onCompleted: () => {
      refetch();
      setIsAddModalOpen(false);
      resetAddForm();
    },
  });

  const [updateDLC, { loading: updating }] = useMutation(UPDATE_DLC, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
    },
  });

  const [deleteDLC, { loading: deleting }] = useMutation(DELETE_DLC, {
    onCompleted: () => refetch(),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_DLCS, {
    onCompleted: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const dlcs: DLC[] = dlcsData?.dlcs || [];

  // Filter DLCs based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDLCs(dlcs);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDLCs(
        dlcs.filter(
          (d) =>
            d.name.toLowerCase().includes(query) ||
            d.slug.toLowerCase().includes(query) ||
            d.type.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, dlcs]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const resetAddForm = () => {
    setNewName("");
    setNewSlug("");
    setNewType("DLC");
  };

  const resetEditForm = () => {
    setEditingDLC(null);
    setEditName("");
    setEditSlug("");
    setEditType("DLC");
  };

  const openEditModal = (dlc: DLC) => {
    setEditingDLC(dlc);
    setEditName(dlc.name);
    setEditSlug(dlc.slug);
    setEditType(dlc.type);
    setIsEditModalOpen(true);
  };

  const handleCreateDLC = async () => {
    if (!newName || !newSlug || !selectedGameId) return;
    await createDLC({
      variables: {
        input: {
          name: newName,
          slug: newSlug,
          type: newType,
          gameId: selectedGameId,
        },
      },
    });
  };

  const handleUpdateDLC = async () => {
    if (!editingDLC || !editName || !editSlug) return;
    await updateDLC({
      variables: {
        id: editingDLC.id,
        input: {
          name: editName,
          slug: editSlug,
          type: editType,
        },
      },
    });
  };

  const openDeleteConfirm = (dlc: DLC) => {
    setDlcToDelete(dlc);
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
    } else if (dlcToDelete) {
      await deleteDLC({ variables: { id: dlcToDelete.id } });
    }
    setConfirmOpen(false);
    setDlcToDelete(null);
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Puzzle size={24} style={{ marginRight: 8 }} />
            DLCs & Expansions
          </h1>
          <p className={styles.sectionSubtitle}>Manage downloadable content for games.</p>
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

      {/* Game Filter */}
      <div style={{ marginBottom: 20 }}>
        <label className={styles.formLabel}>Select a game to manage its DLCs</label>
        <GameSearchPicker
          mode="single"
          value={selectedGame}
          onChange={(game) => {
            setSelectedGame(game);
            setSelectedGameId(game?.id || "");
            setSelectedIds(new Set());
            setSearchQuery("");
          }}
          placeholder="Search the full game catalog..."
          emptyText="No matching games found."
        />
      </div>

      {selectedGameId && (
        <>
          {/* Search and Add Bar */}
          <div className={styles.searchBar}>
            <div className={styles.searchInputWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search DLCs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />
              Add DLC
            </Button>
          </div>

          {/* Add DLC Modal */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="sm:max-w-[420px]" onEnterKeySubmit={handleCreateDLC}>
              <DialogHeader>
                <DialogTitle>Add New DLC</DialogTitle>
                <DialogDescription>
                  Create a new DLC or expansion for the selected game.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className={styles.modalForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Name *</label>
                  <Input
                    placeholder="e.g. The Frozen Wilds"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newSlug || newSlug === generateSlug(newName)) {
                        setNewSlug(generateSlug(e.target.value));
                      }
                    }}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Slug *</label>
                  <Input
                    placeholder="e.g. frozen-wilds"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                  />
                  <span className={styles.formHint}>
                    URL-friendly identifier (lowercase, no spaces)
                  </span>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Type *</label>
                  <Select value={newType} onValueChange={(value) => value && setNewType(value)}>
                    <SelectTrigger>
                      <span>{DLC_TYPE_LABELS[newType] || "Select type"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DLC">DLC</SelectItem>
                      <SelectItem value="EXPANSION">Expansion</SelectItem>
                      <SelectItem value="FREE_UPDATE">Free Update</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={handleCreateDLC}
                  loading={creating}
                  disabled={!newName || !newSlug}
                >
                  Create DLC
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit DLC Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) resetEditForm();
          }}>
            <DialogContent className="sm:max-w-[420px]" onEnterKeySubmit={handleUpdateDLC}>
              <DialogHeader>
                <DialogTitle>Edit DLC</DialogTitle>
                <DialogDescription>
                  Update DLC details.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className={styles.modalForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Name *</label>
                  <Input
                    placeholder="e.g. The Frozen Wilds"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Slug *</label>
                  <Input
                    placeholder="e.g. frozen-wilds"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                  />
                  <span className={styles.formHint}>
                    URL-friendly identifier (lowercase, no spaces)
                  </span>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Type *</label>
                  <Select value={editType} onValueChange={(value) => value && setEditType(value)}>
                    <SelectTrigger>
                      <span>{DLC_TYPE_LABELS[editType] || "Select type"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DLC">DLC</SelectItem>
                      <SelectItem value="EXPANSION">Expansion</SelectItem>
                      <SelectItem value="FREE_UPDATE">Free Update</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={handleUpdateDLC}
                  loading={updating}
                  disabled={!editName || !editSlug}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loading ? (
            <LoadingSpinner text="Loading DLCs..." />
          ) : (
            <>
              {/* Select All Bar */}
              {filteredDLCs.length > 0 && (
                <div className={styles.selectAllBar}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredDLCs.length && filteredDLCs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filteredDLCs.map((d) => d.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  <span className={styles.selectAllLabel}>
                    Select all ({filteredDLCs.length})
                  </span>
                </div>
              )}

              {/* DLCs List */}
              <div className={styles.itemsGrid}>
                {filteredDLCs.map((dlc) => (
                  <div
                    key={dlc.id}
                    className={`${styles.itemCard} ${
                      selectedIds.has(dlc.id) ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.itemCheckbox}
                      checked={selectedIds.has(dlc.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(dlc.id);
                        else newSet.delete(dlc.id);
                        setSelectedIds(newSet);
                      }}
                    />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{dlc.name}</span>
                      <span className={styles.itemSlug}>{dlc.slug}</span>
                      <span className={`${styles.badge} ${styles.badgeCount}`}>
                        {DLC_TYPE_LABELS[dlc.type] || dlc.type}
                      </span>
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditModal(dlc)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => openDeleteConfirm(dlc)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredDLCs.length === 0 && !loading && (
                  <p className={styles.emptyState}>
                    {searchQuery
                      ? `No DLCs found matching "${searchQuery}"`
                      : "No DLCs for this game yet. Click Add DLC to create one."}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!selectedGameId && (
        <p className={styles.emptyState}>Select a game above to manage its DLCs.</p>
      )}

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmDelete}
        loading={confirmAction === "bulk" ? bulkDeleting : deleting}
        title={
          confirmAction === "bulk"
            ? `Delete ${selectedIds.size} DLC(s)?`
            : `Delete ${dlcToDelete?.name}?`
        }
        description={
          confirmAction === "bulk"
            ? "All selected DLCs will be permanently deleted."
            : "This DLC will be permanently deleted."
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
