"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { generateSlug } from "@/lib/slug-utils";
import { isValidHttpUrl, getFieldErrorClass } from "@/lib/validation-utils";

import { toast } from "sonner";
import {
  AdminConfirmDialog,
  CoverPreview,
  GameSearchPicker,
  type SearchableGame,
} from "@/components/admin";
import { FormField } from "@/components/ui/form-field";
import { Button, LoadingSpinner } from "@/components";
import { GET_BUNDLES, GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  BULK_DELETE_BUNDLES,
  CREATE_BUNDLE,
  DELETE_BUNDLE,
  UPDATE_BUNDLE,
} from "@/graphql/admin_mutations";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import styles from "../page.module.css";

const BUNDLE_TYPE_LABELS: Record<string, string> = {
  BUNDLE: "Bundle",
  SEASON_PASS: "Season Pass",
  COLLECTION: "Collection",
  SUBSCRIPTION: "Subscription",
};

interface Platform {
  id: string;
  name: string;
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  coverUrl?: string | null;
  releaseDate?: string | null;
  price?: number | null;
  platform?: Platform | null;
  platformId?: string | null;
  games?: SearchableGame[];
  gameCount: number;
  dlcCount: number;
}

interface ConfirmState {
  kind: "single" | "bulk";
  title: string;
  description: string;
  bundleId?: string;
}

interface BundleFormErrors {
  name?: string;
  slug?: string;
  coverUrl?: string;
  price?: string;
}

function getMutationMessage(error?: { message?: string | null } | null) {
  return error?.message || "Something went wrong. Please try again.";
}

function validateBundleForm(input: {
  name: string;
  slug: string;
  coverUrl: string;
  price: string;
}) {
  const errors: BundleFormErrors = {};

  if (!input.name.trim()) {
    errors.name = "Bundle name is required.";
  }

  if (!input.slug.trim()) {
    errors.slug = "Slug is required.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug.trim())) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  }

  if (input.coverUrl.trim() && !isValidHttpUrl(input.coverUrl.trim())) {
    errors.coverUrl = "Cover URL must start with http:// or https://.";
  }

  if (input.price.trim()) {
    const parsed = Number(input.price);
    if (Number.isNaN(parsed) || parsed < 0) {
      errors.price = "Price must be a positive number or zero.";
    }
  }

  return errors;
}

function normalizeBundleGames(games: SearchableGame[]) {
  const seen = new Set<string>();

  return games.filter((game) => {
    const key = game.gameFamilyId ?? game.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function toGameFamilyIds(games: SearchableGame[]) {
  return normalizeBundleGames(games).map((game) => game.gameFamilyId ?? game.id);
}

export default function AdminBundlesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSlugTouched, setNewSlugTouched] = useState(false);
  const [newType, setNewType] = useState("BUNDLE");
  const [newDescription, setNewDescription] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newReleaseDate, setNewReleaseDate] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPlatformId, setNewPlatformId] = useState("");
  const [newGames, setNewGames] = useState<SearchableGame[]>([]);
  const [newErrors, setNewErrors] = useState<BundleFormErrors>({});

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editType, setEditType] = useState("BUNDLE");
  const [editDescription, setEditDescription] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");
  const [editReleaseDate, setEditReleaseDate] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPlatformId, setEditPlatformId] = useState("");
  const [editGames, setEditGames] = useState<SearchableGame[]>([]);
  const [editErrors, setEditErrors] = useState<BundleFormErrors>({});

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const {
    data: bundlesData,
    loading,
    refetch,
  } = useQuery(GET_BUNDLES);
  const { data: platformsData } = useQuery(GET_PLATFORMS);

  const [createBundle, { loading: creating }] = useMutation(CREATE_BUNDLE);
  const [updateBundle, { loading: updating }] = useMutation(UPDATE_BUNDLE);
  const [deleteBundle, { loading: deleting }] = useMutation(DELETE_BUNDLE);
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(
    BULK_DELETE_BUNDLES
  );

  const bundles = useMemo<Bundle[]>(
    () => bundlesData?.bundles || [],
    [bundlesData]
  );
  const platforms = useMemo(
    () => platformsData?.platforms || [],
    [platformsData]
  );

  const filteredBundles = useMemo(
    () =>
      bundles.filter((bundle: Bundle) => {
        if (!searchQuery.trim()) return true;
        const needle = searchQuery.toLowerCase();
        return (
          bundle.name.toLowerCase().includes(needle) ||
          bundle.slug.toLowerCase().includes(needle)
        );
      }),
    [bundles, searchQuery]
  );

  const resetAddForm = () => {
    setNewName("");
    setNewSlug("");
    setNewSlugTouched(false);
    setNewType("BUNDLE");
    setNewDescription("");
    setNewCoverUrl("");
    setNewReleaseDate("");
    setNewPrice("");
    setNewPlatformId("");
    setNewGames([]);
    setNewErrors({});
  };

  const resetEditForm = () => {
    setEditingBundle(null);
    setEditName("");
    setEditSlug("");
    setEditType("BUNDLE");
    setEditDescription("");
    setEditCoverUrl("");
    setEditReleaseDate("");
    setEditPrice("");
    setEditPlatformId("");
    setEditGames([]);
    setEditErrors({});
  };

  const handleMutationFailure = (
    message: string,
    setErrors?: (errors: BundleFormErrors) => void,
    field?: string | null
  ) => {
    toast.error(message);

    if (!setErrors || !field) return;

    if (field === "name") {
      setErrors({ name: message });
    } else if (field === "slug") {
      setErrors({ slug: message });
    } else if (field === "coverUrl") {
      setErrors({ coverUrl: message });
    } else if (field === "price") {
      setErrors({ price: message });
    }
  };

  const handleCreateBundle = async () => {
    const errors = validateBundleForm({
      name: newName,
      slug: newSlug,
      coverUrl: newCoverUrl,
      price: newPrice,
    });

    setNewErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const { data } = await createBundle({
        variables: {
          input: {
            name: newName.trim(),
            slug: newSlug.trim(),
            type: newType,
            description: newDescription.trim() || null,
            coverUrl: newCoverUrl.trim() || null,
            releaseDate: newReleaseDate || null,
            price: newPrice.trim() ? Number(newPrice) : null,
            platformId: newPlatformId || null,
            gameFamilyIds:
              newGames.length > 0 ? toGameFamilyIds(newGames) : null,
          },
        },
      });

      const payload = data?.createBundle;
      if (!payload?.success) {
        handleMutationFailure(
          getMutationMessage(payload?.error),
          setNewErrors,
          payload?.error?.field
        );
        return;
      }

      await refetch();
      setIsAddModalOpen(false);
      resetAddForm();
      toast.success(`Created ${payload.bundle.name}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to create bundle."
      );
    }
  };

  const handleUpdateBundle = async () => {
    if (!editingBundle) return;

    const errors = validateBundleForm({
      name: editName,
      slug: editSlug,
      coverUrl: editCoverUrl,
      price: editPrice,
    });

    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const { data } = await updateBundle({
        variables: {
          id: editingBundle.id,
          input: {
            name: editName.trim(),
            slug: editSlug.trim(),
            type: editType,
            description: editDescription.trim() || null,
            coverUrl: editCoverUrl.trim() || null,
            releaseDate: editReleaseDate || null,
            price: editPrice.trim() ? Number(editPrice) : null,
            platformId: editPlatformId || null,
            gameFamilyIds: toGameFamilyIds(editGames),
          },
        },
      });

      const payload = data?.updateBundle;
      if (!payload?.success) {
        handleMutationFailure(
          getMutationMessage(payload?.error),
          setEditErrors,
          payload?.error?.field
        );
        return;
      }

      await refetch();
      setIsEditModalOpen(false);
      resetEditForm();
      toast.success(`Saved changes to ${payload.bundle.name}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update bundle."
      );
    }
  };

  const handleSingleDelete = async () => {
    if (!confirmState?.bundleId) return;

    try {
      const { data } = await deleteBundle({
        variables: { id: confirmState.bundleId },
      });

      const payload = data?.deleteBundle;
      if (!payload?.success) {
        toast.error(getMutationMessage(payload?.error));
        return;
      }

      await refetch();
      setConfirmState(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(confirmState.bundleId!);
        return next;
      });
      toast.success("Bundle deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete bundle."
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      const { data } = await bulkDelete({
        variables: { ids: Array.from(selectedIds) },
      });

      const payload = data?.bulkDeleteBundles;
      if (!payload?.success) {
        toast.error(getMutationMessage(payload?.error));
        return;
      }

      await refetch();
      setSelectedIds(new Set());
      setConfirmState(null);
      toast.success(`Deleted ${payload.deletedCount} bundle(s).`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete bundles."
      );
    }
  };

  const openEditModal = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setEditName(bundle.name);
    setEditSlug(bundle.slug);
    setEditType(bundle.type);
    setEditDescription(bundle.description || "");
    setEditCoverUrl(bundle.coverUrl || "");
    setEditReleaseDate(
      bundle.releaseDate ? bundle.releaseDate.split("T")[0] : ""
    );
    setEditPrice(bundle.price?.toString() || "");
    setEditPlatformId(bundle.platformId || "");
    setEditGames(normalizeBundleGames(bundle.games || []));
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  if (loading && bundles.length === 0) {
    return <LoadingSpinner text="Loading bundles..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Package size={24} style={{ marginRight: 8 }} />
            Bundles
          </h1>
          <p className={styles.sectionSubtitle}>
            Manage game bundles, collections, and season passes.
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setConfirmState({
                kind: "bulk",
                title: `Delete ${selectedIds.size} bundles?`,
                description:
                  "Remove every selected bundle from the current filtered list.",
              })
            }
          >
            <Trash2 size={14} />
            Delete {selectedIds.size}
          </Button>
        )}
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search bundles..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            resetAddForm();
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} />
          Add Bundle
        </Button>
      </div>

      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) resetAddForm();
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Add New Bundle</DialogTitle>
            <DialogDescription>
              Create a new bundle, collection, season pass, or subscription.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5 py-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Identity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Core naming and classification fields used across the site.
                </p>
              </div>

              <FormField label="Bundle Name" required error={newErrors.name}>
                <Input
                  placeholder="Enter bundle name"
                  value={newName}
                  onChange={(event) => {
                    const value = event.target.value;
                    setNewName(value);
                    setNewErrors((prev) => ({ ...prev, name: undefined }));
                    if (!newSlugTouched) {
                      setNewSlug(generateSlug(value));
                    }
                  }}
                  className={getFieldErrorClass(Boolean(newErrors.name))}
                  aria-invalid={Boolean(newErrors.name)}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Slug"
                  required
                  hint="Generated from the name until you edit it manually."
                  error={newErrors.slug}
                >
                  <Input
                    placeholder="bundle-slug"
                    value={newSlug}
                    onChange={(event) => {
                      setNewSlugTouched(true);
                      setNewSlug(event.target.value);
                      setNewErrors((prev) => ({ ...prev, slug: undefined }));
                    }}
                    className={getFieldErrorClass(Boolean(newErrors.slug))}
                    aria-invalid={Boolean(newErrors.slug)}
                  />
                </FormField>

                <FormField label="Type" required>
                  <Select value={newType} onValueChange={(value) => setNewType(value || "BUNDLE")}>
                    <SelectTrigger>
                      <span>{BUNDLE_TYPE_LABELS[newType]}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BUNDLE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="Platform">
                <Select
                  value={newPlatformId}
                  onValueChange={(value) => setNewPlatformId(value || "")}
                >
                  <SelectTrigger>
                    <span>
                      {platforms.find((p: Platform) => p.id === newPlatformId)?.name || "Select a platform"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform: Platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Details
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Metadata used for storefront-style presentation.
                </p>
              </div>

              <FormField label="Description">
                <Textarea
                  placeholder="Enter bundle description"
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  rows={4}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Release Date">
                  <Input
                    type="date"
                    value={newReleaseDate}
                    onChange={(event) => setNewReleaseDate(event.target.value)}
                  />
                </FormField>

                <FormField label="Price" error={newErrors.price}>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(event) => {
                      setNewPrice(event.target.value);
                      setNewErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                    className={getFieldErrorClass(Boolean(newErrors.price))}
                    aria-invalid={Boolean(newErrors.price)}
                  />
                </FormField>
              </div>

              <FormField
                label="Cover URL"
                hint="Use a direct image URL starting with http:// or https://."
                error={newErrors.coverUrl}
              >
                <Input
                  placeholder="https://example.com/cover.jpg"
                  value={newCoverUrl}
                  onChange={(event) => {
                    setNewCoverUrl(event.target.value);
                    setNewErrors((prev) => ({ ...prev, coverUrl: undefined }));
                  }}
                  className={getFieldErrorClass(Boolean(newErrors.coverUrl))}
                  aria-invalid={Boolean(newErrors.coverUrl)}
                />
              </FormField>

              {newCoverUrl.trim() && (
                <FormField label="Cover Preview">
                  <CoverPreview
                    url={newCoverUrl.trim()}
                    alt="New bundle cover preview"
                  />
                </FormField>
              )}
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Included Games
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Search the full catalog and add games without leaving the form.
                </p>
              </div>

              <FormField label="Games">
                <GameSearchPicker
                  mode="multiple"
                  value={newGames}
                  onChange={(games) => setNewGames(normalizeBundleGames(games))}
                  placeholder="Search the full game catalog..."
                  emptyText="No matching games found."
                />
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
            <Button onClick={handleCreateBundle} loading={creating}>
              Create Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) resetEditForm();
        }}
      >
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>
              Update bundle details and included games without losing your list
              context.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-5 py-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Identity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Core naming and classification fields used across the site.
                </p>
              </div>

              <FormField label="Bundle Name" required error={editErrors.name}>
                <Input
                  placeholder="Enter bundle name"
                  value={editName}
                  onChange={(event) => {
                    setEditName(event.target.value);
                    setEditErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={getFieldErrorClass(Boolean(editErrors.name))}
                  aria-invalid={Boolean(editErrors.name)}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Slug" required error={editErrors.slug}>
                  <Input
                    placeholder="bundle-slug"
                    value={editSlug}
                    onChange={(event) => {
                      setEditSlug(event.target.value);
                      setEditErrors((prev) => ({ ...prev, slug: undefined }));
                    }}
                    className={getFieldErrorClass(Boolean(editErrors.slug))}
                    aria-invalid={Boolean(editErrors.slug)}
                  />
                </FormField>

                <FormField label="Type" required>
                  <Select
                    value={editType}
                    onValueChange={(value) => setEditType(value || "BUNDLE")}
                  >
                    <SelectTrigger>
                      <span>{BUNDLE_TYPE_LABELS[editType]}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BUNDLE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <FormField label="Platform">
                <Select
                  value={editPlatformId}
                  onValueChange={(value) => setEditPlatformId(value || "")}
                >
                  <SelectTrigger>
                    <span>
                      {platforms.find((p: Platform) => p.id === editPlatformId)?.name || "Select a platform"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform: Platform) => (
                      <SelectItem key={platform.id} value={platform.id}>
                        {platform.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Details
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Metadata used for storefront-style presentation.
                </p>
              </div>

              <FormField label="Description">
                <Textarea
                  placeholder="Enter bundle description"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={4}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Release Date">
                  <Input
                    type="date"
                    value={editReleaseDate}
                    onChange={(event) => setEditReleaseDate(event.target.value)}
                  />
                </FormField>

                <FormField label="Price" error={editErrors.price}>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editPrice}
                    onChange={(event) => {
                      setEditPrice(event.target.value);
                      setEditErrors((prev) => ({ ...prev, price: undefined }));
                    }}
                    className={getFieldErrorClass(Boolean(editErrors.price))}
                    aria-invalid={Boolean(editErrors.price)}
                  />
                </FormField>
              </div>

              <FormField
                label="Cover URL"
                hint="Use a direct image URL starting with http:// or https://."
                error={editErrors.coverUrl}
              >
                <Input
                  placeholder="https://example.com/cover.jpg"
                  value={editCoverUrl}
                  onChange={(event) => {
                    setEditCoverUrl(event.target.value);
                    setEditErrors((prev) => ({ ...prev, coverUrl: undefined }));
                  }}
                  className={getFieldErrorClass(Boolean(editErrors.coverUrl))}
                  aria-invalid={Boolean(editErrors.coverUrl)}
                />
              </FormField>

              {editCoverUrl.trim() && (
                <FormField label="Cover Preview">
                  <CoverPreview
                    url={editCoverUrl.trim()}
                    alt="Edited bundle cover preview"
                  />
                </FormField>
              )}
            </div>

            <div className="space-y-4 border-t border-[var(--border-color)] pt-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Included Games
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Search the full catalog and keep the selected games visible as
                  removable chips.
                </p>
              </div>

              <FormField label="Games">
                <GameSearchPicker
                  mode="multiple"
                  value={editGames}
                  onChange={(games) => setEditGames(normalizeBundleGames(games))}
                  placeholder="Search the full game catalog..."
                  emptyText="No matching games found."
                />
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
            <Button onClick={handleUpdateBundle} loading={updating}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {bundles.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={
              selectedIds.size === filteredBundles.length &&
              filteredBundles.length > 0
            }
            onChange={(event) => {
              if (event.target.checked) {
                setSelectedIds(
                  new Set(filteredBundles.map((bundle: Bundle) => bundle.id))
                );
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>
            Select all filtered bundles ({filteredBundles.length})
          </span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {filteredBundles.map((bundle: Bundle) => (
          <div
            key={bundle.id}
            className={`${styles.itemCard} ${
              selectedIds.has(bundle.id) ? styles.selected : ""
            }`}
          >
            <input
              type="checkbox"
              className={styles.itemCheckbox}
              checked={selectedIds.has(bundle.id)}
              onChange={(event) => {
                const next = new Set(selectedIds);
                if (event.target.checked) next.add(bundle.id);
                else next.delete(bundle.id);
                setSelectedIds(next);
              }}
            />
            <div className={styles.itemInfo}>
              <span className={styles.itemName}>{bundle.name}</span>
              <span className={styles.itemSlug}>
                {bundle.platform?.name || "No platform"} • {bundle.slug}
              </span>
              <span className={`${styles.badge} ${styles.badgeCount}`}>
                {bundle.type.replace("_", " ")}
              </span>
            </div>
            <span className={styles.itemMeta}>
              {bundle.gameCount} games, {bundle.dlcCount} DLCs
            </span>
            <div className={styles.itemActions}>
              <button
                className={styles.actionBtn}
                onClick={() => openEditModal(bundle)}
                title="Edit bundle"
              >
                <Pencil size={14} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={() =>
                  setConfirmState({
                    kind: "single",
                    bundleId: bundle.id,
                    title: `Delete ${bundle.name}?`,
                    description:
                      "This will permanently remove the selected bundle record.",
                  })
                }
                title="Delete bundle"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {filteredBundles.length === 0 && !loading && (
          <p className={styles.emptyState}>
            {searchQuery
              ? `No bundles found matching "${searchQuery}"`
              : "No bundles yet. Click Add Bundle to create one."}
          </p>
        )}
      </div>

      <AdminConfirmDialog
        open={Boolean(confirmState)}
        onOpenChange={(open) => {
          if (!open) setConfirmState(null);
        }}
        title={confirmState?.title || "Confirm action"}
        description={confirmState?.description || ""}
        confirmLabel={
          confirmState?.kind === "bulk" ? "Delete Bundles" : "Delete Bundle"
        }
        loading={confirmState?.kind === "bulk" ? bulkDeleting : deleting}
        onConfirm={() => {
          if (confirmState?.kind === "bulk") {
            return handleBulkDelete();
          }
          return handleSingleDelete();
        }}
      />
    </div>
  );
}
