"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_GAME_VERSIONS } from "@/graphql/admin_queries";
import {
  CREATE_GAME_VERSION,
  UPDATE_GAME_VERSION,
  DELETE_GAME_VERSION,
  SET_DEFAULT_VERSION,
  BULK_DELETE_GAME_VERSIONS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search, Star, Cloud } from "lucide-react";
import { generateSlug } from "@/lib/slug-utils";
import { handlePlatformIconError } from "@/lib/image-utils";
import { Button, LoadingSpinner } from "@/components";
import { AdminConfirmDialog, CoverPreview } from "@/components/admin";
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
import { Checkbox } from "@/components/ui/checkbox";
import { GameSearchPicker, type SearchableGame } from "@/components/admin/game-search-picker";
import styles from "../page.module.css";

interface LinkedGame {
  id: string;
  title: string;
  platform?: { id: string; name: string; slug: string } | null;
}

interface GameVersion {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverUrl?: string | null;
  effectiveCoverUrl?: string | null;
  isDefault: boolean;
  digitalOnly: boolean;
  gameIds: string[];
  gameCount: number;
  games: LinkedGame[];
}

export default function AdminGameVersionsPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVersions, setFilteredVersions] = useState<GameVersion[]>([]);

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newSelectedGames, setNewSelectedGames] = useState<SearchableGame[]>([]);
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [newDigitalOnly, setNewDigitalOnly] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<GameVersion | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editSelectedGames, setEditSelectedGames] = useState<SearchableGame[]>([]);
  const [editDigitalOnly, setEditDigitalOnly] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"single" | "bulk">("single");
  const [versionToDelete, setVersionToDelete] = useState<GameVersion | null>(null);

  const {
    data: versionsData,
    loading,
    refetch,
  } = useQuery(GET_GAME_VERSIONS, {
    // No gameId filter - get all versions
    variables: {},
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
            v.slug.toLowerCase().includes(query) ||
            v.games.some((g) => g.title.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, versions]);

  const resetAddForm = () => {
    setNewName("");
    setNewSlug("");
    setNewDescription("");
    setNewCoverUrl("");
    setNewSelectedGames([]);
    setNewIsDefault(false);
    setNewDigitalOnly(false);
  };

  const resetEditForm = () => {
    setEditingVersion(null);
    setEditName("");
    setEditSlug("");
    setEditDescription("");
    setEditCoverUrl("");
    setEditSelectedGames([]);
    setEditDigitalOnly(false);
  };

  const openEditModal = (version: GameVersion) => {
    setEditingVersion(version);
    setEditName(version.name);
    setEditSlug(version.slug);
    setEditDescription(version.description ?? "");
    setEditCoverUrl(version.coverUrl ?? "");
    setEditDigitalOnly(version.digitalOnly);
    // Convert linked games to SearchableGame format
    setEditSelectedGames(
      version.games.map((g) => ({
        id: g.id,
        title: g.title,
        platform: g.platform,
      }))
    );
    setIsEditModalOpen(true);
  };

  const handleCreateVersion = async () => {
    if (!newName || !newSlug || newSelectedGames.length === 0) return;
    await createVersion({
      variables: {
        input: {
          name: newName,
          slug: newSlug,
          description: newDescription || null,
          coverUrl: newCoverUrl || null,
          gameIds: newSelectedGames.map((g) => g.id),
          isDefault: newIsDefault,
          digitalOnly: newDigitalOnly,
        },
      },
    });
  };

  const handleUpdateVersion = async () => {
    if (!editingVersion || !editName || !editSlug || editSelectedGames.length === 0) return;
    await updateVersion({
      variables: {
        id: editingVersion.id,
        input: {
          name: editName,
          slug: editSlug,
          description: editDescription || null,
          coverUrl: editCoverUrl || null,
          gameIds: editSelectedGames.map((g) => g.id),
          digitalOnly: editDigitalOnly,
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

  // Group games by title for display
  const groupGamesByTitle = (games: LinkedGame[]) => {
    const groups: Map<string, LinkedGame[]> = new Map();
    for (const game of games) {
      if (!groups.has(game.title)) {
        groups.set(game.title, []);
      }
      groups.get(game.title)!.push(game);
    }
    return Array.from(groups.entries());
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
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            Add Version
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search versions or games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Add Version Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[520px]" onEnterKeySubmit={handleCreateVersion}>
          <DialogHeader>
            <DialogTitle>Add New Version</DialogTitle>
            <DialogDescription>
              Create a new version or edition that can be linked to multiple games.
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

            <FormField label="Slug" required hint="URL-friendly identifier (globally unique)">
              <Input
                placeholder="e.g. deluxe-edition"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </FormField>

            <FormField label="Description" hint="Optional description of this version">
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm resize-y"
                placeholder="What makes this version special?"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </FormField>

            <FormField label="Cover URL" hint="Optional cover image specific to this version">
              <Input
                placeholder="https://example.com/cover.jpg"
                value={newCoverUrl}
                onChange={(e) => setNewCoverUrl(e.target.value)}
              />
              {newCoverUrl && <CoverPreview url={newCoverUrl.trim()} alt="Version cover preview" />}
            </FormField>

            <FormField label="Linked Games" required hint="Select one or more games for this version">
              <GameSearchPicker
                mode="multiple"
                value={newSelectedGames}
                onChange={setNewSelectedGames}
                placeholder="Search and select games..."
              />
            </FormField>

            <div className="flex items-center gap-3">
              <Checkbox
                id="new-is-default"
                checked={newIsDefault}
                onCheckedChange={(checked) => setNewIsDefault(checked === true)}
              />
              <label htmlFor="new-is-default" className="text-sm text-[var(--text-primary)] cursor-pointer">
                Set as default version
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="new-digital-only"
                checked={newDigitalOnly}
                onCheckedChange={(checked) => setNewDigitalOnly(checked === true)}
              />
              <label htmlFor="new-digital-only" className="text-sm text-[var(--text-primary)] cursor-pointer flex items-center gap-2">
                <Cloud size={14} />
                Digital only (no physical release)
              </label>
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
              onClick={handleCreateVersion}
              loading={creating}
              disabled={!newName || !newSlug || newSelectedGames.length === 0}
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
        <DialogContent className="sm:max-w-[520px]" onEnterKeySubmit={handleUpdateVersion}>
          <DialogHeader>
            <DialogTitle>Edit Version</DialogTitle>
            <DialogDescription>
              Update version details and linked games.
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

            <FormField label="Slug" required hint="URL-friendly identifier (globally unique)">
              <Input
                placeholder="e.g. deluxe-edition"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
              />
            </FormField>

            <FormField label="Description" hint="Optional description of this version">
              <textarea
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm resize-y"
                placeholder="What makes this version special?"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </FormField>

            <FormField label="Cover URL" hint="Optional cover image specific to this version">
              <Input
                placeholder="https://example.com/cover.jpg"
                value={editCoverUrl}
                onChange={(e) => setEditCoverUrl(e.target.value)}
              />
              {editCoverUrl && <CoverPreview url={editCoverUrl.trim()} alt="Version cover preview" />}
            </FormField>

            <FormField label="Linked Games" required hint="Select one or more games for this version">
              <GameSearchPicker
                mode="multiple"
                value={editSelectedGames}
                onChange={setEditSelectedGames}
                placeholder="Search and select games..."
              />
            </FormField>

            <div className="flex items-center gap-3">
              <Checkbox
                id="edit-digital-only"
                checked={editDigitalOnly}
                onCheckedChange={(checked) => setEditDigitalOnly(checked === true)}
              />
              <label htmlFor="edit-digital-only" className="text-sm text-[var(--text-primary)] cursor-pointer flex items-center gap-2">
                <Cloud size={14} />
                Digital only (no physical release)
              </label>
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
              onClick={handleUpdateVersion}
              loading={updating}
              disabled={!editName || !editSlug || editSelectedGames.length === 0}
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
            {filteredVersions.map((version) => {
              const groupedGames = groupGamesByTitle(version.games);

              return (
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

                    {/* Display linked games with platform icons */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {groupedGames.map(([title, games]) => (
                        <div
                          key={title}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1 text-xs"
                        >
                          <span className="inline-flex items-center gap-0.5">
                            {games.map((game) =>
                              game.platform?.slug ? (
                                <img
                                  key={game.id}
                                  src={`/platforms/${game.platform.slug}.svg`}
                                  alt={game.platform.name || ""}
                                  title={game.platform.name || ""}
                                  className="size-3.5"
                                  onError={handlePlatformIconError}
                                />
                              ) : null
                            )}
                          </span>
                          <span className="text-[var(--text-primary)] max-w-[180px] truncate">
                            {title}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {version.isDefault && (
                        <span className={`${styles.badge} ${styles.badgeDefault}`}>Default</span>
                      )}
                      {version.digitalOnly && (
                        <span className={`${styles.badge} ${styles.badgeDigital}`}>
                          <Cloud size={10} />
                          Digital Only
                        </span>
                      )}
                    </div>
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
              );
            })}
            {filteredVersions.length === 0 && !loading && (
              <p className={styles.emptyState}>
                {searchQuery
                  ? `No versions found matching "${searchQuery}"`
                  : "No versions yet. Click Add Version to create one."}
              </p>
            )}
          </div>
        </>
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
