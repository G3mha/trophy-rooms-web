"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  CREATE_PLATFORM,
  UPDATE_PLATFORM,
  DELETE_PLATFORM,
  BULK_DELETE_PLATFORMS,
  CREATE_PLATFORM_RELEASE,
  UPDATE_PLATFORM_RELEASE,
  DELETE_PLATFORM_RELEASE,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search, Gamepad2 } from "lucide-react";
import { generateSlug } from "@/lib/slug-utils";
import { Button, LoadingSpinner } from "@/components";
import { AdminConfirmDialog, AdminImage, CoverPreview } from "@/components/admin";
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
import { Textarea } from "@/components/ui/textarea";
import { X, Image as ImageIcon, Calendar } from "lucide-react";
import styles from "../page.module.css";

interface PlatformRelease {
  id: string;
  region: string;
  releaseDate: string;
}

interface Platform {
  id: string;
  name: string;
  slug: string;
  description?: string;
  consolePictureUrl?: string;
  promotionalPictures?: string[];
  releases?: PlatformRelease[];
  gameCount: number;
}

export default function AdminPlatformsPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newConsolePictureUrl, setNewConsolePictureUrl] = useState("");
  const [newPromotionalPictures, setNewPromotionalPictures] = useState<string[]>([]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editConsolePictureUrl, setEditConsolePictureUrl] = useState("");
  const [editPromotionalPictures, setEditPromotionalPictures] = useState<string[]>([]);

  // New release state (for adding releases in edit modal)
  const [newReleaseRegion, setNewReleaseRegion] = useState("");
  const [newReleaseDate, setNewReleaseDate] = useState("");
  const [editingReleaseId, setEditingReleaseId] = useState<string | null>(null);
  const [editReleaseRegion, setEditReleaseRegion] = useState("");
  const [editReleaseDate, setEditReleaseDate] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"single" | "bulk">("single");
  const [platformToDelete, setPlatformToDelete] = useState<Platform | null>(null);

  const {
    data: platformsData,
    loading,
    refetch,
  } = useQuery(GET_PLATFORMS);

  const [createPlatform, { loading: creating }] = useMutation(CREATE_PLATFORM, {
    onCompleted: () => {
      refetch();
      setIsAddModalOpen(false);
      resetAddForm();
      toast.success("Platform created.");
    },
    onError: (error) => toast.error(error.message || "Failed to create platform."),
  });

  const [updatePlatform, { loading: updating }] = useMutation(UPDATE_PLATFORM, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
      toast.success("Platform updated.");
    },
    onError: (error) => toast.error(error.message || "Failed to update platform."),
  });

  const [deletePlatform] = useMutation(DELETE_PLATFORM, {
    onCompleted: () => {
      refetch();
      toast.success("Platform deleted.");
    },
    onError: (error) => toast.error(error.message || "Failed to delete platform."),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_PLATFORMS, {
    onCompleted: (data) => {
      refetch();
      setSelectedIds(new Set());
      toast.success(`Deleted ${data?.bulkDeletePlatforms?.deletedCount || 0} platform(s).`);
    },
    onError: (error) => toast.error(error.message || "Failed to delete platforms."),
  });

  const [createRelease, { loading: creatingRelease }] = useMutation(CREATE_PLATFORM_RELEASE, {
    onCompleted: () => {
      refetch();
      setNewReleaseRegion("");
      setNewReleaseDate("");
      toast.success("Release date added.");
    },
    onError: (error) => toast.error(error.message || "Failed to add release date."),
  });

  const [updateRelease, { loading: updatingRelease }] = useMutation(UPDATE_PLATFORM_RELEASE, {
    onCompleted: () => {
      refetch();
      setEditingReleaseId(null);
      setEditReleaseRegion("");
      setEditReleaseDate("");
      toast.success("Release date updated.");
    },
    onError: (error) => toast.error(error.message || "Failed to update release date."),
  });

  const [deleteRelease] = useMutation(DELETE_PLATFORM_RELEASE, {
    onCompleted: () => {
      refetch();
      toast.success("Release date deleted.");
    },
    onError: (error) => toast.error(error.message || "Failed to delete release date."),
  });

  const platforms: Platform[] = useMemo(
    () => platformsData?.platforms || [],
    [platformsData]
  );
  const filteredPlatforms = useMemo(() => {
    if (!searchQuery.trim()) {
      return platforms;
    }

    const query = searchQuery.toLowerCase();
    return platforms.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
    );
  }, [searchQuery, platforms]);

  const resetAddForm = () => {
    setNewName("");
    setNewSlug("");
    setNewDescription("");
    setNewConsolePictureUrl("");
    setNewPromotionalPictures([]);
  };

  const resetEditForm = () => {
    setEditingPlatform(null);
    setEditName("");
    setEditSlug("");
    setEditDescription("");
    setEditConsolePictureUrl("");
    setEditPromotionalPictures([]);
    setNewReleaseRegion("");
    setNewReleaseDate("");
    setEditingReleaseId(null);
    setEditReleaseRegion("");
    setEditReleaseDate("");
  };

  const openEditModal = (platform: Platform) => {
    setEditingPlatform(platform);
    setEditName(platform.name);
    setEditSlug(platform.slug);
    setEditDescription(platform.description || "");
    setEditConsolePictureUrl(platform.consolePictureUrl || "");
    setEditPromotionalPictures(platform.promotionalPictures || []);
    setIsEditModalOpen(true);
  };

  const handleCreatePlatform = async () => {
    if (!newName || !newSlug) return;
    const filteredPromoPics = newPromotionalPictures.filter(url => url.trim() !== "");
    await createPlatform({
      variables: {
        input: {
          name: newName,
          slug: newSlug,
          description: newDescription || null,
          consolePictureUrl: newConsolePictureUrl || null,
          promotionalPictures: filteredPromoPics.length > 0 ? filteredPromoPics : null,
        },
      },
    });
  };

  const handleUpdatePlatform = async () => {
    if (!editingPlatform || !editName || !editSlug) return;
    const filteredPromoPics = editPromotionalPictures.filter(url => url.trim() !== "");
    await updatePlatform({
      variables: {
        id: editingPlatform.id,
        input: {
          name: editName,
          slug: editSlug,
          description: editDescription || null,
          consolePictureUrl: editConsolePictureUrl || null,
          promotionalPictures: filteredPromoPics,
        },
      },
    });
  };

  const handleAddRelease = async () => {
    if (!editingPlatform || !newReleaseRegion || !newReleaseDate) return;
    await createRelease({
      variables: {
        input: {
          platformId: editingPlatform.id,
          region: newReleaseRegion,
          releaseDate: newReleaseDate,
        },
      },
    });
  };

  const handleUpdateRelease = async () => {
    if (!editingReleaseId || !editReleaseRegion || !editReleaseDate) return;
    await updateRelease({
      variables: {
        id: editingReleaseId,
        input: {
          region: editReleaseRegion,
          releaseDate: editReleaseDate,
        },
      },
    });
  };

  const handleDeleteRelease = async (releaseId: string) => {
    await deleteRelease({ variables: { id: releaseId } });
  };

  const startEditRelease = (release: PlatformRelease) => {
    setEditingReleaseId(release.id);
    setEditReleaseRegion(release.region);
    // Convert date to YYYY-MM-DD format for input
    setEditReleaseDate(release.releaseDate.split("T")[0]);
  };

  const cancelEditRelease = () => {
    setEditingReleaseId(null);
    setEditReleaseRegion("");
    setEditReleaseDate("");
  };

  const openDeleteConfirm = (platform: Platform) => {
    setPlatformToDelete(platform);
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
    } else if (platformToDelete) {
      await deletePlatform({ variables: { id: platformToDelete.id } });
    }
    setConfirmOpen(false);
    setPlatformToDelete(null);
  };

  if (loading) {
    return <LoadingSpinner text="Loading platforms..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Platforms</h1>
          <p className={styles.sectionSubtitle}>Create and manage gaming platforms.</p>
        </div>
        <div className={styles.headerActions}>
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

      <div className={`${styles.contextPanel} ${styles.contextPanelCompact}`}>
        <div className={styles.contextPanelHeader}>
          <h2 className={styles.contextPanelTitle}>Library Assets</h2>
          <p className={styles.contextPanelDescription}>
            Platforms drive console branding, promo art, and regional launch metadata across the admin tools.
          </p>
        </div>
      </div>

      {/* Search and Add Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search platforms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Add Platform
        </Button>
      </div>

      {/* Add Platform Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[620px]" onEnterKeySubmit={handleCreatePlatform}>
          <DialogHeader>
            <DialogTitle>Add New Platform</DialogTitle>
            <DialogDescription>
              Create a new gaming platform.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-6 py-2 max-h-[65vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Identity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  The core fields used for platform naming and URLs.
                </p>
              </div>

              <FormField label="Platform Name" required>
                <Input
                  placeholder="e.g. PlayStation 5"
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
                  placeholder="e.g. ps5"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  placeholder="A brief description of the platform..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Visual Assets
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Optional imagery used in cards, banners, and platform pages.
                </p>
              </div>

              <FormField label="Console Picture URL" hint="Transparent PNG of the console">
                <Input
                  placeholder="https://example.com/console.png"
                  value={newConsolePictureUrl}
                  onChange={(e) => setNewConsolePictureUrl(e.target.value)}
                />
                {newConsolePictureUrl.trim() && (
                  <CoverPreview
                    url={newConsolePictureUrl.trim()}
                    alt="Console picture preview"
                  />
                )}
              </FormField>

              <FormField label="Promotional Pictures" hint="Add URLs for promotional images">
                <div className={styles.mediaList}>
                  {newPromotionalPictures.map((url, index) => (
                    <div key={index} className={styles.mediaRow}>
                      <div className={styles.mediaThumb}>
                        <AdminImage
                          src={url}
                          alt={`Promo ${index + 1}`}
                          fallback={
                            <ImageIcon size={18} className="text-[var(--text-muted)]" />
                          }
                        />
                      </div>
                      <Input
                        placeholder="https://example.com/promo.png"
                        value={url}
                        onChange={(e) => {
                          const updated = [...newPromotionalPictures];
                          updated[index] = e.target.value;
                          setNewPromotionalPictures(updated);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setNewPromotionalPictures(newPromotionalPictures.filter((_, i) => i !== index));
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewPromotionalPictures([...newPromotionalPictures, ""])}
                  >
                    <ImageIcon size={14} />
                    Add Picture URL
                  </Button>
                </div>
              </FormField>
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
              onClick={handleCreatePlatform}
              loading={creating}
              disabled={!newName || !newSlug}
            >
              Create Platform
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Platform Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) resetEditForm();
      }}>
        <DialogContent className="sm:max-w-[680px]" onEnterKeySubmit={handleUpdatePlatform}>
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>
              Update platform details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-6 py-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Identity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Core metadata for the platform record.
                </p>
              </div>

              <FormField label="Platform Name" required>
                <Input
                  placeholder="e.g. PlayStation 5"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </FormField>

              <FormField label="Slug" required hint="URL-friendly identifier (lowercase, no spaces)">
                <Input
                  placeholder="e.g. ps5"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                />
              </FormField>

              <FormField label="Description">
                <Textarea
                  placeholder="A brief description of the platform..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </FormField>
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Visual Assets
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Maintain the console hero art and supporting promotional images.
                </p>
              </div>

              <FormField label="Console Picture URL" hint="Transparent PNG of the console">
                <Input
                  placeholder="https://example.com/console.png"
                  value={editConsolePictureUrl}
                  onChange={(e) => setEditConsolePictureUrl(e.target.value)}
                />
                {editConsolePictureUrl.trim() && (
                  <CoverPreview
                    url={editConsolePictureUrl.trim()}
                    alt="Console preview"
                  />
                )}
              </FormField>

              <FormField label="Promotional Pictures" hint="Add URLs for promotional images">
                <div className={styles.mediaList}>
                  {editPromotionalPictures.map((url, index) => (
                    <div key={index} className={styles.mediaRow}>
                      <div className={styles.mediaThumb}>
                        <AdminImage
                          src={url}
                          alt={`Promo ${index + 1}`}
                          fallback={
                            <ImageIcon size={18} className="text-[var(--text-muted)]" />
                          }
                        />
                      </div>
                      <Input
                        placeholder="https://example.com/promo.png"
                        value={url}
                        onChange={(e) => {
                          const updated = [...editPromotionalPictures];
                          updated[index] = e.target.value;
                          setEditPromotionalPictures(updated);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditPromotionalPictures(editPromotionalPictures.filter((_, i) => i !== index));
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditPromotionalPictures([...editPromotionalPictures, ""])}
                  >
                    <ImageIcon size={14} />
                    Add Picture URL
                  </Button>
                </div>
              </FormField>
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Release Dates
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Track launch dates by region without leaving the modal.
                </p>
              </div>

              <FormField label="Regional Launches" hint="Manage regional release dates">
                <div className={styles.releaseList}>
                  {editingPlatform?.releases?.map((release) => (
                    <div key={release.id}>
                      {editingReleaseId === release.id ? (
                        <div className={styles.releaseEditRow}>
                          <Input
                            placeholder="Region (e.g. NA, EU, JP)"
                            value={editReleaseRegion}
                            onChange={(e) => setEditReleaseRegion(e.target.value)}
                          />
                          <Input
                            type="date"
                            value={editReleaseDate}
                            onChange={(e) => setEditReleaseDate(e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUpdateRelease}
                            disabled={updatingRelease || !editReleaseRegion || !editReleaseDate}
                          >
                            {updatingRelease ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={cancelEditRelease}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className={styles.releaseRow}>
                          <div className={styles.releaseReadOnly}>
                            <span className={styles.releaseRegion}>{release.region}</span>
                            <span className={styles.releaseDate}>
                              {new Date(release.releaseDate).toLocaleDateString()}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => startEditRelease(release)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteRelease(release.id)}
                            className="text-[var(--switch-neon-red)] hover:text-[var(--switch-neon-red)]"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className={styles.releaseAddRow}>
                    <Input
                      placeholder="Region (e.g. NA, EU, JP)"
                      value={newReleaseRegion}
                      onChange={(e) => setNewReleaseRegion(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={newReleaseDate}
                      onChange={(e) => setNewReleaseDate(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddRelease}
                      disabled={creatingRelease || !newReleaseRegion || !newReleaseDate}
                    >
                      <Calendar size={14} />
                      {creatingRelease ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </div>
              </FormField>
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
              onClick={handleUpdatePlatform}
              loading={updating}
              disabled={!editName || !editSlug}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select All Bar */}
      {filteredPlatforms.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === filteredPlatforms.length && filteredPlatforms.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(filteredPlatforms.map((p) => p.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>
            Select all ({filteredPlatforms.length})
          </span>
        </div>
      )}

      {/* Platforms List */}
      <div className={styles.itemsGrid}>
        {filteredPlatforms.map((platform) => (
          <div
            key={platform.id}
            className={`${styles.itemCard} ${
              selectedIds.has(platform.id) ? styles.selected : ""
            }`}
          >
            <input
              type="checkbox"
              className={styles.itemCheckbox}
              checked={selectedIds.has(platform.id)}
              onChange={(e) => {
                const newSet = new Set(selectedIds);
                if (e.target.checked) newSet.add(platform.id);
                else newSet.delete(platform.id);
                setSelectedIds(newSet);
              }}
            />
            <div className="w-8 h-8 flex-shrink-0 bg-[var(--bg-secondary)] rounded flex items-center justify-center overflow-hidden">
              <AdminImage
                src={platform.consolePictureUrl}
                alt=""
                className="w-full h-full object-contain p-1"
                fallback={<Gamepad2 size={16} className="text-[var(--text-muted)]" />}
              />
            </div>
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{platform.name}</span>
              <span className={styles.itemSlug}>{platform.slug}</span>
              {platform.description && (
                <span className={styles.itemMeta}>{platform.description}</span>
              )}
            </div>
            <span className={styles.itemMeta}>
              {platform.gameCount} {platform.gameCount === 1 ? "game" : "games"}
            </span>
            <div className={styles.itemActions}>
              <button
                className={styles.actionBtn}
                onClick={() => openEditModal(platform)}
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={() => openDeleteConfirm(platform)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {filteredPlatforms.length === 0 && !loading && (
          <p className={styles.emptyState}>
            {searchQuery
              ? `No platforms found matching "${searchQuery}"`
              : "No platforms yet. Click Add Platform to create one."}
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
            ? `Delete ${selectedIds.size} platform(s)?`
            : `Delete ${platformToDelete?.name}?`
        }
        description={
          confirmAction === "bulk"
            ? "All selected platforms will be permanently deleted."
            : "This platform will be permanently deleted."
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
