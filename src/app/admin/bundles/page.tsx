"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_BUNDLES } from "@/graphql/admin_queries";
import {
  CREATE_BUNDLE,
  UPDATE_BUNDLE,
  DELETE_BUNDLE,
  BULK_DELETE_BUNDLES,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X, ChevronDown, Package } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import styles from "../page.module.css";

interface Bundle {
  id: string;
  name: string;
  slug: string;
  type: string;
  gameCount: number;
  dlcCount: number;
}

export default function AdminBundlesPage() {
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("BUNDLE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const {
    data: bundlesData,
    loading,
    refetch,
  } = useQuery(GET_BUNDLES);

  const [createBundle, { loading: creating }] = useMutation(CREATE_BUNDLE, {
    onCompleted: () => refetch(),
  });
  const [updateBundle] = useMutation(UPDATE_BUNDLE, {
    onCompleted: () => refetch(),
  });
  const [deleteBundle] = useMutation(DELETE_BUNDLE, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_BUNDLES, {
    onCompleted: () => { refetch(); setSelectedIds(new Set()); },
  });

  const bundles = bundlesData?.bundles || [];

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

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!newName || !newSlug) return;
          await createBundle({
            variables: {
              input: {
                name: newName,
                slug: newSlug,
                type: newType,
              },
            },
          });
          setNewName("");
          setNewSlug("");
        }}
        className={`${styles.formRow} ${styles.formRow3Col}`}
      >
        <input
          className={styles.input}
          placeholder="Bundle name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Slug"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
        />
        <div className={styles.selectWrapper}>
          <select
            className={styles.input}
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            <option value="BUNDLE">Bundle</option>
            <option value="SEASON_PASS">Season Pass</option>
            <option value="COLLECTION">Collection</option>
            <option value="SUBSCRIPTION">Subscription</option>
          </select>
          <ChevronDown size={14} className={styles.selectIcon} />
        </div>
        <Button type="submit" loading={creating}>
          Add Bundle
        </Button>
      </form>

      {bundles.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === bundles.length && bundles.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(bundles.map((b: Bundle) => b.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>Select all ({bundles.length})</span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {bundles.map((bundle: Bundle) => (
          <div
            key={bundle.id}
            className={`${styles.itemCard} ${selectedIds.has(bundle.id) ? styles.selected : ""}`}
          >
            {editingId === bundle.id ? (
              <div className={styles.editForm}>
                <input
                  className={styles.editInput}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Name"
                />
                <input
                  className={styles.editInput}
                  value={editingSlug}
                  onChange={(e) => setEditingSlug(e.target.value)}
                  placeholder="Slug"
                />
                <div className={styles.editActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={async () => {
                      await updateBundle({
                        variables: {
                          id: bundle.id,
                          input: { name: editingName, slug: editingSlug },
                        },
                      });
                      setEditingId(null);
                    }}
                  >
                    <Check size={16} />
                  </button>
                  <button className={styles.actionBtn} onClick={() => setEditingId(null)}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                  <span className={styles.itemSlug}>{bundle.slug}</span>
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
                    onClick={() => {
                      setEditingId(bundle.id);
                      setEditingName(bundle.name);
                      setEditingSlug(bundle.slug);
                    }}
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
