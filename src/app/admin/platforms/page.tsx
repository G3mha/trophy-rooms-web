"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  CREATE_PLATFORM,
  UPDATE_PLATFORM,
  DELETE_PLATFORM,
  BULK_DELETE_PLATFORMS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Plus, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { X, Image as ImageIcon } from "lucide-react";
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
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([]);

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

  const platforms: Platform[] = platformsData?.platforms || [];

  // Filter platforms based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlatforms(platforms);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPlatforms(
        platforms.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.slug.toLowerCase().includes(query)
        )
      );
    }
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
        <DialogContent className="sm:max-w-[420px]" onEnterKeySubmit={handleCreatePlatform}>
          <DialogHeader>
            <DialogTitle>Add New Platform</DialogTitle>
            <DialogDescription>
              Create a new gaming platform.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5 py-2 max-h-[60vh] overflow-y-auto">
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

            <FormField label="Console Picture URL" hint="Transparent PNG of the console">
              <Input
                placeholder="https://example.com/console.png"
                value={newConsolePictureUrl}
                onChange={(e) => setNewConsolePictureUrl(e.target.value)}
              />
              {newConsolePictureUrl && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={newConsolePictureUrl}
                    alt="Console preview"
                    className="max-h-24 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </FormField>

            <FormField label="Promotional Pictures" hint="Add URLs for promotional images">
              <div className="flex flex-col gap-2">
                {newPromotionalPictures.map((url, index) => (
                  <div key={index} className="flex gap-2">
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
        <DialogContent className="sm:max-w-[420px]" onEnterKeySubmit={handleUpdatePlatform}>
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>
              Update platform details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5 py-2 max-h-[60vh] overflow-y-auto">
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

            <FormField label="Console Picture URL" hint="Transparent PNG of the console">
              <Input
                placeholder="https://example.com/console.png"
                value={editConsolePictureUrl}
                onChange={(e) => setEditConsolePictureUrl(e.target.value)}
              />
              {editConsolePictureUrl && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={editConsolePictureUrl}
                    alt="Console preview"
                    className="max-h-24 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </FormField>

            <FormField label="Promotional Pictures" hint="Add URLs for promotional images">
              <div className="flex flex-col gap-2">
                {editPromotionalPictures.map((url, index) => (
                  <div key={index} className="flex gap-2">
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

            {editingPlatform?.releases && editingPlatform.releases.length > 0 && (
              <FormField label="Release Dates">
                <div className="flex flex-col gap-1 text-sm">
                  {editingPlatform.releases.map((release) => (
                    <div key={release.id} className="flex justify-between items-center py-1 px-2 bg-muted rounded">
                      <span className="font-medium">{release.region}</span>
                      <span className="text-muted-foreground">
                        {new Date(release.releaseDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </FormField>
            )}
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
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{platform.name}</span>
              <span className={styles.itemSlug}>{platform.slug}</span>
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
