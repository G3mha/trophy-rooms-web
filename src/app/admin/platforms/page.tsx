"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  CREATE_PLATFORM,
  UPDATE_PLATFORM,
  DELETE_PLATFORM,
  BULK_DELETE_PLATFORMS,
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
import styles from "../page.module.css";

interface Platform {
  id: string;
  name: string;
  slug: string;
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

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    },
  });

  const [updatePlatform, { loading: updating }] = useMutation(UPDATE_PLATFORM, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
    },
  });

  const [deletePlatform] = useMutation(DELETE_PLATFORM, {
    onCompleted: () => refetch(),
  });

  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_PLATFORMS, {
    onCompleted: () => {
      refetch();
      setSelectedIds(new Set());
    },
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
  };

  const resetEditForm = () => {
    setEditingPlatform(null);
    setEditName("");
    setEditSlug("");
  };

  const openEditModal = (platform: Platform) => {
    setEditingPlatform(platform);
    setEditName(platform.name);
    setEditSlug(platform.slug);
    setIsEditModalOpen(true);
  };

  const handleCreatePlatform = async () => {
    if (!newName || !newSlug) return;
    await createPlatform({
      variables: {
        input: {
          name: newName,
          slug: newSlug,
        },
      },
    });
  };

  const handleUpdatePlatform = async () => {
    if (!editingPlatform || !editName || !editSlug) return;
    await updatePlatform({
      variables: {
        id: editingPlatform.id,
        input: {
          name: editName,
          slug: editSlug,
        },
      },
    });
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
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
              loading={bulkDeleting}
              onClick={async () => {
                if (confirm(`Delete ${selectedIds.size} platform(s)?`)) {
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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add New Platform</DialogTitle>
            <DialogDescription>
              Create a new gaming platform.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Platform Name *</label>
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
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Slug *</label>
              <Input
                placeholder="e.g. ps5"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
              <span className={styles.formHint}>
                URL-friendly identifier (lowercase, no spaces)
              </span>
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
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit Platform</DialogTitle>
            <DialogDescription>
              Update platform details.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Platform Name *</label>
              <Input
                placeholder="e.g. PlayStation 5"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Slug *</label>
              <Input
                placeholder="e.g. ps5"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
              />
              <span className={styles.formHint}>
                URL-friendly identifier (lowercase, no spaces)
              </span>
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
                onClick={async () => {
                  if (confirm(`Delete ${platform.name}?`)) {
                    await deletePlatform({ variables: { id: platform.id } });
                  }
                }}
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
    </div>
  );
}
