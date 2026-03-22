"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_GAMES_ADMIN, GET_GAME_VERSIONS } from "@/graphql/admin_queries";
import {
  CREATE_GAME_VERSION,
  UPDATE_GAME_VERSION,
  DELETE_GAME_VERSION,
  SET_DEFAULT_VERSION,
  BULK_DELETE_GAME_VERSIONS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X, ChevronDown, Star } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import styles from "../page.module.css";

interface Game {
  id: string;
  title: string;
}

interface GameVersion {
  id: string;
  name: string;
  slug: string;
  isDefault: boolean;
  gameId: string;
}

export default function AdminGameVersionsPage() {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
    onCompleted: () => refetch(),
  });
  const [updateVersion] = useMutation(UPDATE_GAME_VERSION, {
    onCompleted: () => refetch(),
  });
  const [deleteVersion] = useMutation(DELETE_GAME_VERSION, {
    onCompleted: () => refetch(),
  });
  const [setDefaultVersion] = useMutation(SET_DEFAULT_VERSION, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_GAME_VERSIONS, {
    onCompleted: () => { refetch(); setSelectedIds(new Set()); },
  });

  const games = gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];
  const versions = versionsData?.gameVersions || [];

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Game Versions</h1>
          <p className={styles.sectionSubtitle}>Manage different versions/editions of games.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={bulkDeleting}
            onClick={async () => {
              if (confirm(`Delete ${selectedIds.size} version(s)?`)) {
                await bulkDelete({ variables: { ids: Array.from(selectedIds) } });
              }
            }}
          >
            <Trash2 size={14} />
            Delete {selectedIds.size}
          </Button>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className={styles.selectWrapper} style={{ maxWidth: 400 }}>
          <select
            className={styles.input}
            value={selectedGameId}
            onChange={(e) => {
              setSelectedGameId(e.target.value);
              setSelectedIds(new Set());
            }}
          >
            <option value="">Select a game...</option>
            {games.map((g: Game) => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.selectIcon} />
        </div>
      </div>

      {selectedGameId && (
        <>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newName || !newSlug) return;
              await createVersion({
                variables: {
                  input: {
                    name: newName,
                    slug: newSlug,
                    gameId: selectedGameId,
                  },
                },
              });
              setNewName("");
              setNewSlug("");
            }}
            className={`${styles.formRow} ${styles.formRow2Col}`}
          >
            <input
              className={styles.input}
              placeholder="Version name (e.g. Deluxe Edition)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className={styles.input}
              placeholder="Slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
            <Button type="submit" loading={creating}>
              Add Version
            </Button>
          </form>

          {loading ? (
            <LoadingSpinner text="Loading versions..." />
          ) : (
            <>
              {versions.length > 0 && (
                <div className={styles.selectAllBar}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === versions.length && versions.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(versions.map((v: GameVersion) => v.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  <span className={styles.selectAllLabel}>Select all ({versions.length})</span>
                </div>
              )}

              <div className={styles.itemsGrid}>
                {versions.map((version: GameVersion) => (
                  <div
                    key={version.id}
                    className={`${styles.itemCard} ${selectedIds.has(version.id) ? styles.selected : ""}`}
                  >
                    {editingId === version.id ? (
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
                              await updateVersion({
                                variables: {
                                  id: version.id,
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
                            onClick={() => {
                              setEditingId(version.id);
                              setEditingName(version.name);
                              setEditingSlug(version.slug);
                            }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={async () => {
                              if (confirm(`Delete ${version.name}?`)) {
                                await deleteVersion({ variables: { id: version.id } });
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
                {versions.length === 0 && (
                  <p className={styles.itemMeta}>No versions for this game yet.</p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!selectedGameId && (
        <p className={styles.itemMeta}>Select a game to manage its versions.</p>
      )}
    </div>
  );
}
