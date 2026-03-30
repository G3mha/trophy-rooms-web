"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_BUNDLES, GET_GAMES_ADMIN, GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  CREATE_BUNDLE,
  UPDATE_BUNDLE,
  DELETE_BUNDLE,
  BULK_DELETE_BUNDLES,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Package, Plus, Search, X } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import styles from "../page.module.css";

interface Platform {
  id: string;
  name: string;
}

interface Game {
  id: string;
  title: string;
  coverUrl?: string | null;
}

interface DLC {
  id: string;
  name: string;
  game?: { id: string; title: string } | null;
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
  games?: Game[];
  dlcs?: DLC[];
  gameCount: number;
  dlcCount: number;
}

const BUNDLE_TYPE_LABELS: Record<string, string> = {
  BUNDLE: "Bundle",
  SEASON_PASS: "Season Pass",
  COLLECTION: "Collection",
  SUBSCRIPTION: "Subscription",
};

export default function AdminBundlesPage() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("BUNDLE");
  const [newDescription, setNewDescription] = useState("");
  const [newCoverUrl, setNewCoverUrl] = useState("");
  const [newReleaseDate, setNewReleaseDate] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newPlatformId, setNewPlatformId] = useState("");
  const [newGameIds, setNewGameIds] = useState<string[]>([]);

  // Edit modal state
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
  const [editGameIds, setEditGameIds] = useState<string[]>([]);

  // Game search state
  const [gameSearch, setGameSearch] = useState("");
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data: bundlesData,
    loading,
    refetch,
  } = useQuery(GET_BUNDLES);

  const { data: gamesData } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 100, orderBy: "TITLE_ASC" },
  });

  const { data: platformsData } = useQuery(GET_PLATFORMS);

  const [createBundle, { loading: creating }] = useMutation(CREATE_BUNDLE, {
    onCompleted: () => {
      refetch();
      setIsAddModalOpen(false);
      resetAddForm();
    },
  });
  const [updateBundle, { loading: updating }] = useMutation(UPDATE_BUNDLE, {
    onCompleted: () => {
      refetch();
      setIsEditModalOpen(false);
      resetEditForm();
    },
  });
  const [deleteBundle] = useMutation(DELETE_BUNDLE, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_BUNDLES, {
    onCompleted: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const bundles = bundlesData?.bundles || [];
  const allGames = gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];
  const platforms = platformsData?.platforms || [];

  const filteredBundles = bundles.filter((b: Bundle) =>
    searchQuery === "" ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGames = allGames.filter((g: Game) =>
    gameSearch === "" || g.title.toLowerCase().includes(gameSearch.toLowerCase())
  );

  const resetAddForm = () => {
    setNewName("");
    setNewSlug("");
    setNewType("BUNDLE");
    setNewDescription("");
    setNewCoverUrl("");
    setNewReleaseDate("");
    setNewPrice("");
    setNewPlatformId("");
    setNewGameIds([]);
    setGameSearch("");
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
    setEditGameIds([]);
    setGameSearch("");
  };

  const openEditModal = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setEditName(bundle.name);
    setEditSlug(bundle.slug);
    setEditType(bundle.type);
    setEditDescription(bundle.description || "");
    setEditCoverUrl(bundle.coverUrl || "");
    setEditReleaseDate(bundle.releaseDate ? bundle.releaseDate.split("T")[0] : "");
    setEditPrice(bundle.price?.toString() || "");
    setEditPlatformId(bundle.platformId || "");
    setEditGameIds(bundle.games?.map((g) => g.id) || []);
    setIsEditModalOpen(true);
  };

  const handleCreateBundle = async () => {
    if (!newName || !newSlug) return;
    await createBundle({
      variables: {
        input: {
          name: newName,
          slug: newSlug,
          type: newType,
          description: newDescription || null,
          coverUrl: newCoverUrl || null,
          releaseDate: newReleaseDate || null,
          price: newPrice ? parseFloat(newPrice) : null,
          platformId: newPlatformId || null,
          gameIds: newGameIds.length > 0 ? newGameIds : null,
        },
      },
    });
  };

  const handleUpdateBundle = async () => {
    if (!editingBundle || !editName || !editSlug) return;
    await updateBundle({
      variables: {
        id: editingBundle.id,
        input: {
          name: editName,
          slug: editSlug,
          type: editType,
          description: editDescription || null,
          coverUrl: editCoverUrl || null,
          releaseDate: editReleaseDate || null,
          price: editPrice ? parseFloat(editPrice) : null,
          platformId: editPlatformId || null,
          gameIds: editGameIds,
        },
      },
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  // Game selector component
  const GameSelector = ({
    selectedIds,
    onSelect,
    onRemove,
  }: {
    selectedIds: string[];
    onSelect: (id: string) => void;
    onRemove: (id: string) => void;
  }) => {
    const selectedGames = allGames.filter((g: Game) => selectedIds.includes(g.id));
    const availableGames = filteredGames.filter((g: Game) => !selectedIds.includes(g.id));

    return (
      <div className={styles.formField}>
        <label className={styles.formLabel}>Games</label>

        {/* Selected games */}
        {selectedGames.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {selectedGames.map((game: Game) => (
              <span
                key={game.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "var(--border-radius)",
                  fontSize: 14,
                }}
              >
                {game.title}
                <button
                  type="button"
                  onClick={() => onRemove(game.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--text-muted)",
                  }}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search and dropdown */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              value={gameSearch}
              onChange={(e) => {
                setGameSearch(e.target.value);
                setIsGameDropdownOpen(true);
              }}
              onFocus={() => setIsGameDropdownOpen(true)}
              placeholder="Search games to add..."
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                border: "2px solid var(--border-color)",
                borderRadius: "var(--border-radius)",
                backgroundColor: "var(--bg-secondary)",
                color: "var(--text-primary)",
                fontSize: 14,
              }}
            />
          </div>

          {isGameDropdownOpen && availableGames.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                maxHeight: 200,
                overflowY: "auto",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--border-radius)",
                marginTop: 4,
                zIndex: 50,
              }}
            >
              {availableGames.slice(0, 20).map((game: Game) => (
                <div
                  key={game.id}
                  onClick={() => {
                    onSelect(game.id);
                    setGameSearch("");
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-card-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {game.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && bundles.length === 0) {
    return <LoadingSpinner text="Loading bundles..." />;
  }

  return (
    <div onClick={() => setIsGameDropdownOpen(false)}>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Package size={24} style={{ marginRight: 8 }} />
            Bundles
          </h1>
          <p className={styles.sectionSubtitle}>Manage game bundles, collections, and season passes.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={bulkDeleting}
            onClick={async () => {
              if (confirm(`Delete ${selectedIds.size} bundle(s)?`)) {
                await bulkDelete({ variables: { ids: Array.from(selectedIds) } });
              }
            }}
          >
            <Trash2 size={14} />
            Delete {selectedIds.size}
          </Button>
        )}
      </div>

      {/* Search and Add Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search bundles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Add Bundle
        </Button>
      </div>

      {/* Add Bundle Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add New Bundle</DialogTitle>
            <DialogDescription>
              Create a new game bundle, collection, or season pass.
            </DialogDescription>
          </DialogHeader>

          <div className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Bundle Name *</label>
              <Input
                placeholder="Enter bundle name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug || newSlug === generateSlug(newName.slice(0, -1))) {
                    setNewSlug(generateSlug(e.target.value));
                  }
                }}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Slug *</label>
              <Input
                placeholder="bundle-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Type</label>
              <Select value={newType} onValueChange={(value) => setNewType(value || "BUNDLE")}>
                <SelectTrigger>
                  <span>{BUNDLE_TYPE_LABELS[newType] || "Select type"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUNDLE">Bundle</SelectItem>
                  <SelectItem value="SEASON_PASS">Season Pass</SelectItem>
                  <SelectItem value="COLLECTION">Collection</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Platform</label>
              <Select value={newPlatformId} onValueChange={(value) => setNewPlatformId(value || "")}>
                <SelectTrigger>
                  <span className={newPlatformId ? "" : "text-[var(--text-muted)]"}>
                    {platforms.find((p: Platform) => p.id === newPlatformId)?.name || "Select a platform"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p: Platform) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Description</label>
              <Textarea
                placeholder="Enter bundle description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Release Date</label>
                <Input
                  type="date"
                  value={newReleaseDate}
                  onChange={(e) => setNewReleaseDate(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Price</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Cover URL</label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={newCoverUrl}
                onChange={(e) => setNewCoverUrl(e.target.value)}
              />
            </div>

            {newCoverUrl && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Cover Preview</label>
                <div className={styles.coverPreview}>
                  <img
                    src={newCoverUrl}
                    alt="Cover preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            <GameSelector
              selectedIds={newGameIds}
              onSelect={(id) => setNewGameIds([...newGameIds, id])}
              onRemove={(id) => setNewGameIds(newGameIds.filter((gid) => gid !== id))}
            />
          </div>

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
              onClick={handleCreateBundle}
              loading={creating}
              disabled={!newName || !newSlug}
            >
              Create Bundle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bundle Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) resetEditForm();
      }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Bundle</DialogTitle>
            <DialogDescription>
              Update bundle details.
            </DialogDescription>
          </DialogHeader>

          <div className={styles.modalForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Bundle Name *</label>
              <Input
                placeholder="Enter bundle name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Slug *</label>
              <Input
                placeholder="bundle-slug"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Type</label>
              <Select value={editType} onValueChange={(value) => setEditType(value || "BUNDLE")}>
                <SelectTrigger>
                  <span>{BUNDLE_TYPE_LABELS[editType] || "Select type"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUNDLE">Bundle</SelectItem>
                  <SelectItem value="SEASON_PASS">Season Pass</SelectItem>
                  <SelectItem value="COLLECTION">Collection</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Platform</label>
              <Select value={editPlatformId} onValueChange={(value) => setEditPlatformId(value || "")}>
                <SelectTrigger>
                  <span className={editPlatformId ? "" : "text-[var(--text-muted)]"}>
                    {platforms.find((p: Platform) => p.id === editPlatformId)?.name || "Select a platform"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((p: Platform) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Description</label>
              <Textarea
                placeholder="Enter bundle description (optional)"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Release Date</label>
                <Input
                  type="date"
                  value={editReleaseDate}
                  onChange={(e) => setEditReleaseDate(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Price</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Cover URL</label>
              <Input
                placeholder="https://example.com/cover.jpg"
                value={editCoverUrl}
                onChange={(e) => setEditCoverUrl(e.target.value)}
              />
            </div>

            {editCoverUrl && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Cover Preview</label>
                <div className={styles.coverPreview}>
                  <img
                    src={editCoverUrl}
                    alt="Cover preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            <GameSelector
              selectedIds={editGameIds}
              onSelect={(id) => setEditGameIds([...editGameIds, id])}
              onRemove={(id) => setEditGameIds(editGameIds.filter((gid) => gid !== id))}
            />
          </div>

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
              onClick={handleUpdateBundle}
              loading={updating}
              disabled={!editName || !editSlug}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {bundles.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === filteredBundles.length && filteredBundles.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(filteredBundles.map((b: Bundle) => b.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>Select all ({filteredBundles.length})</span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {filteredBundles.map((bundle: Bundle) => (
          <div
            key={bundle.id}
            className={`${styles.itemCard} ${selectedIds.has(bundle.id) ? styles.selected : ""}`}
          >
            <input
              type="checkbox"
              className={styles.itemCheckbox}
              checked={selectedIds.has(bundle.id)}
              onChange={(e) => {
                const newSet = new Set(selectedIds);
                if (e.target.checked) newSet.add(bundle.id);
                else newSet.delete(bundle.id);
                setSelectedIds(newSet);
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
                title="Edit"
              >
                <Pencil size={14} />
              </button>
              <button
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={async () => {
                  if (confirm(`Delete ${bundle.name}?`)) {
                    await deleteBundle({ variables: { id: bundle.id } });
                  }
                }}
                title="Delete"
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
    </div>
  );
}
