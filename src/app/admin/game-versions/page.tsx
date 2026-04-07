"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_GAMES_ADMIN, GET_GAME_VERSIONS } from "@/graphql/admin_queries";
import {
  CREATE_GAME_VERSION,
  UPDATE_GAME_VERSION,
  DELETE_GAME_VERSION,
  SET_DEFAULT_VERSION,
  BULK_DELETE_GAME_VERSIONS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search, Star } from "lucide-react";
import { generateSlug } from "@/lib/slug-utils";
import { Button, LoadingSpinner } from "@/components";
import { AdminConfirmDialog } from "@/components/admin";
import { FormField } from "@/components/ui/form-field";
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
import { GameCombobox } from "@/components/ui/game-combobox";
import styles from "../page.module.css";

interface Game {
  id: string;
  title: string;
  coverUrl?: string | null;
  platform?: { name: string } | null;
}

interface GameVersion {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  gameId: string;
}

export default function AdminGameVersionsPage() {
  // Game filter state
  const [selectedGameId, setSelectedGameId] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVersions, setFilteredVersions] = useState<GameVersion[]>([]);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<GameVersion | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"single" | "bulk">("single");
  const [versionToDelete, setVersionToDelete] = useState<GameVersion | null>(null);

  const { data: gamesData } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 500, orderBy: "TITLE_ASC" },
  });

  const {
    data: versionsData,
    loading,
    refetch,
  } = useQuery(GET_GAME_VERSIONS, {
    variables: { gameId: selectedGameId },
    skip: !selectedGameId,
  });

  const [createVersion, { loading: creating }] = useMutation(CREATE_GAME_VERSION, {
    onCompleted: () => {
      refetch();
      setIsAddModalOpen(false);
      resetAddForm();
      toast.success("Version created.");
    },
    onError: (error) => toast.error(error.message || "Failed to create version."),
  });

  const [updateVersion, { loading: updating }] = useMutation(UPDATE_GAME_VERSION, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
      toast.success("Version updated.");
    },
    onError: (error) => toast.error(error.message || "Failed to update version."),
  });

  const [deleteVersion] = useMutation(DELETE_GAME_VERSION, {
    onCompleted: () => {
      refetch();
      toast.success("Version deleted.");
    },
    onError: (error) => toast.error(error.message || "Failed to delete version."),
  });

  const [setDefaultVersion] = useMutation(SET_DEFAULT_VERSION, {
    onCompleted: () => {
      refetch();
      toast.success("Default version updated.");
    },
    onError: (error) => toast.error(error.message || "Failed to set default version."),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_GAME_VERSIONS, {
    onCompleted: (data) => {
      refetch();
      setSelectedIds(new Set());
      toast.success(`Deleted ${data?.bulkDeleteGameVersions?.deletedCount || 0} version(s).`);
    },
    onError: (error) => toast.error(error.message || "Failed to delete versions."),
  });

  const games: Game[] = gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];
  const versions: GameVersion[] = versionsData?.gameVersions || [];

  // Filter versions based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVersions(versions);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredVersions(
        versions.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.slug.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, versions]);

  const resetAddForm = () => {
    setNewName("");
    setNewSlug("");
  };

  const resetEditForm = () => {
    setEditingVersion(null);
    setEditName("");
    setEditSlug("");
  };

  const openEditModal = (version: GameVersion) => {
    setEditingVersion(version);
    setEditName(version.name);
    setEditSlug(version.slug);
    setIsEditModalOpen(true);
  };

  const handleCreateVersion = async () => {
    if (!newName || !newSlug || !selectedGameId) return;
    await createVersion({
      variables: {
        input: {
          name: newName,
          slug: newSlug,
          gameId: selectedGameId,
        },
      },
    });
  };

  const handleUpdateVersion = async () => {
    if (!editingVersion || !editName || !editSlug) return;
    await updateVersion({
      variables: {
        id: editingVersion.id,
        input: {
          name: editName,
          slug: editSlug,
        },
      },
    });
  };

  const openDeleteConfirm = (version: GameVersion) => {
    setVersionToDelete(version);
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
    } else if (versionToDelete) {
      await deleteVersion({ variables: { id: versionToDelete.id } });
    }
    setConfirmOpen(false);
    setVersionToDelete(null);
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Game Versions</h1>
          <p className={styles.sectionSubtitle}>Manage different versions/editions of games.</p>
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
        <label className={styles.formLabel}>Select a game to manage its versions</label>
        <GameCombobox
          games={games}
          value={selectedGameId}
          onChange={(gameId) => {
            setSelectedGameId(gameId);
            setSelectedIds(new Set());
            setSearchQuery("");
          }}
          placeholder="Search for a game..."
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
                placeholder="Search versions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus size={18} />
              Add Version
            </Button>
          </div>

          {/* Add Version Modal */}
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="sm:max-w-[420px]" onEnterKeySubmit={handleCreateVersion}>
              <DialogHeader>
                <DialogTitle>Add New Version</DialogTitle>
                <DialogDescription>
                  Create a new version or edition for the selected game.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="flex flex-col gap-5 py-2">
                <FormField label="Name" required>
                  <Input
                    placeholder="e.g. Deluxe Edition"
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newSlug || newSlug === generateSlug(newName)) {
                        setNewSlug(generateSlug(e.target.value));
                      }
                    }}
                  />
                </FormField>

                <FormField label="Slug" required hint="URL-friendly identifier (lowercase, no spaces)">
                  <Input
                    placeholder="e.g. deluxe-edition"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
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
                  onClick={handleCreateVersion}
                  loading={creating}
                  disabled={!newName || !newSlug}
                >
                  Create Version
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Version Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={(open) => {
            setIsEditModalOpen(open);
            if (!open) resetEditForm();
          }}>
            <DialogContent className="sm:max-w-[420px]" onEnterKeySubmit={handleUpdateVersion}>
              <DialogHeader>
                <DialogTitle>Edit Version</DialogTitle>
                <DialogDescription>
                  Update version details.
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="flex flex-col gap-5 py-2">
                <FormField label="Name" required>
                  <Input
                    placeholder="e.g. Deluxe Edition"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </FormField>

                <FormField label="Slug" required hint="URL-friendly identifier (lowercase, no spaces)">
                  <Input
                    placeholder="e.g. deluxe-edition"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
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
                  onClick={handleUpdateVersion}
                  loading={updating}
                  disabled={!editName || !editSlug}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loading ? (
            <LoadingSpinner text="Loading versions..." />
          ) : (
            <>
              {/* Select All Bar */}
              {filteredVersions.length > 0 && (
                <div className={styles.selectAllBar}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredVersions.length && filteredVersions.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(filteredVersions.map((v) => v.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  <span className={styles.selectAllLabel}>
                    Select all ({filteredVersions.length})
                  </span>
                </div>
              )}

              {/* Versions List */}
              <div className={styles.itemsGrid}>
                {filteredVersions.map((version) => (
                  <div
                    key={version.id}
                    className={`${styles.itemCard} ${
                      selectedIds.has(version.id) ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.itemCheckbox}
                      checked={selectedIds.has(version.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedIds);
                        if (e.target.checked) newSet.add(version.id);
                        else newSet.delete(version.id);
                        setSelectedIds(newSet);
                      }}
                    />
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{version.name}</span>
                      <span className={styles.itemSlug}>{version.slug}</span>
                      {version.isDefault && (
                        <span className={`${styles.badge} ${styles.badgeDefault}`}>Default</span>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      {!version.isDefault && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => setDefaultVersion({ variables: { id: version.id } })}
                          title="Set as default"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditModal(version)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => openDeleteConfirm(version)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredVersions.length === 0 && !loading && (
                  <p className={styles.emptyState}>
                    {searchQuery
                      ? `No versions found matching "${searchQuery}"`
                      : "No versions for this game yet. Click Add Version to create one."}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!selectedGameId && (
        <p className={styles.emptyState}>Select a game above to manage its versions.</p>
      )}

      {/* Confirm Delete Dialog */}
      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirmDelete}
        loading={bulkDeleting}
        title={
          confirmAction === "bulk"
            ? `Delete ${selectedIds.size} version(s)?`
            : `Delete ${versionToDelete?.name}?`
        }
        description={
          confirmAction === "bulk"
            ? "All selected versions will be permanently deleted."
            : "This version will be permanently deleted."
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
