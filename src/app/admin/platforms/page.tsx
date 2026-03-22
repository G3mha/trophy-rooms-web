"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  CREATE_PLATFORM,
  UPDATE_PLATFORM,
  DELETE_PLATFORM,
  BULK_DELETE_PLATFORMS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import styles from "../page.module.css";

export default function AdminPlatformsPage() {
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformSlug, setNewPlatformSlug] = useState("");
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [editingPlatformName, setEditingPlatformName] = useState("");
  const [editingPlatformSlug, setEditingPlatformSlug] = useState("");
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set());

  const {
    data: platformsData,
    loading: platformsLoading,
    refetch: refetchPlatforms,
  } = useQuery(GET_PLATFORMS);

  const [createPlatform, { loading: creatingPlatform }] = useMutation(
    CREATE_PLATFORM,
    { onCompleted: () => refetchPlatforms() }
  );
  const [updatePlatform] = useMutation(UPDATE_PLATFORM, {
    onCompleted: () => refetchPlatforms(),
  });
  const [deletePlatform] = useMutation(DELETE_PLATFORM, {
    onCompleted: () => refetchPlatforms(),
  });
  const [bulkDeletePlatforms, { loading: bulkDeletingPlatforms }] = useMutation(
    BULK_DELETE_PLATFORMS,
    { onCompleted: () => { refetchPlatforms(); setSelectedPlatformIds(new Set()); } }
  );

  const platforms = platformsData?.platforms || [];

  if (platformsLoading) {
    return <LoadingSpinner text="Loading platforms..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Platforms</h1>
          <p className={styles.sectionSubtitle}>Create and manage gaming platforms.</p>
        </div>
        {selectedPlatformIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={bulkDeletingPlatforms}
            onClick={async () => {
              if (confirm(`Delete ${selectedPlatformIds.size} platform(s)?`)) {
                await bulkDeletePlatforms({ variables: { ids: Array.from(selectedPlatformIds) } });
              }
            }}
          >
            <Trash2 size={14} />
            Delete {selectedPlatformIds.size}
          </Button>
        )}
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!newPlatformName || !newPlatformSlug) return;
          await createPlatform({
            variables: {
              input: {
                name: newPlatformName,
                slug: newPlatformSlug,
              },
            },
          });
          setNewPlatformName("");
          setNewPlatformSlug("");
        }}
        className={`${styles.formRow} ${styles.formRow2Col}`}
      >
        <input
          className={styles.input}
          placeholder="Platform name"
          value={newPlatformName}
          onChange={(event) => setNewPlatformName(event.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Platform slug"
          value={newPlatformSlug}
          onChange={(event) => setNewPlatformSlug(event.target.value)}
        />
        <Button type="submit" loading={creatingPlatform}>
          Add Platform
        </Button>
      </form>

      {platforms.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedPlatformIds.size === platforms.length && platforms.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedPlatformIds(new Set(platforms.map((p: { id: string }) => p.id)));
              } else {
                setSelectedPlatformIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>Select all ({platforms.length})</span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {platforms.map((platform: { id: string; name: string; slug: string }) => (
          <div
            key={platform.id}
            className={`${styles.itemCard} ${selectedPlatformIds.has(platform.id) ? styles.selected : ''}`}
          >
            {editingPlatformId === platform.id ? (
              <div className={styles.editForm}>
                <input
                  className={styles.editInput}
                  value={editingPlatformName}
                  onChange={(event) => setEditingPlatformName(event.target.value)}
                  placeholder="Name"
                />
                <input
                  className={styles.editInput}
                  value={editingPlatformSlug}
                  onChange={(event) => setEditingPlatformSlug(event.target.value)}
                  placeholder="Slug"
                />
                <div className={styles.editActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={async () => {
                      await updatePlatform({
                        variables: {
                          id: platform.id,
                          input: {
                            name: editingPlatformName,
                            slug: editingPlatformSlug,
                          },
                        },
                      });
                      setEditingPlatformId(null);
                    }}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => setEditingPlatformId(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="checkbox"
                  className={styles.itemCheckbox}
                  checked={selectedPlatformIds.has(platform.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedPlatformIds);
                    if (e.target.checked) {
                      newSet.add(platform.id);
                    } else {
                      newSet.delete(platform.id);
                    }
                    setSelectedPlatformIds(newSet);
                  }}
                />
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{platform.name}</span>
                  <span className={styles.itemSlug}>{platform.slug}</span>
                </div>
                <div className={styles.itemActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      setEditingPlatformId(platform.id);
                      setEditingPlatformName(platform.name);
                      setEditingPlatformSlug(platform.slug);
                    }}
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
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
