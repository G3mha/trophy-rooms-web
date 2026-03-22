"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_GAMES_ADMIN, GET_DLCS } from "@/graphql/admin_queries";
import {
  CREATE_DLC,
  UPDATE_DLC,
  DELETE_DLC,
  BULK_DELETE_DLCS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X, ChevronDown, Puzzle } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import styles from "../page.module.css";

interface Game {
  id: string;
  title: string;
}

interface DLC {
  id: string;
  name: string;
  slug: string;
  type: string;
  game?: { title: string } | null;
}

export default function AdminDLCsPage() {
  const [selectedGameId, setSelectedGameId] = useState("");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("DLC");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: gamesData } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 500, orderBy: "TITLE_ASC" },
  });

  const {
    data: dlcsData,
    loading,
    refetch,
  } = useQuery(GET_DLCS, {
    variables: { gameId: selectedGameId },
    skip: !selectedGameId,
  });

  const [createDLC, { loading: creating }] = useMutation(CREATE_DLC, {
    onCompleted: () => refetch(),
  });
  const [updateDLC] = useMutation(UPDATE_DLC, {
    onCompleted: () => refetch(),
  });
  const [deleteDLC] = useMutation(DELETE_DLC, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_DLCS, {
    onCompleted: () => { refetch(); setSelectedIds(new Set()); },
  });

  const games = gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];
  const dlcs = dlcsData?.dlcs || [];

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Puzzle size={24} style={{ marginRight: 8 }} />
            DLCs & Expansions
          </h1>
          <p className={styles.sectionSubtitle}>Manage downloadable content for games.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={bulkDeleting}
            onClick={async () => {
              if (confirm(`Delete ${selectedIds.size} DLC(s)?`)) {
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
              await createDLC({
                variables: {
                  input: {
                    name: newName,
                    slug: newSlug,
                    type: newType,
                    gameId: selectedGameId,
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
              placeholder="DLC name"
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
                <option value="DLC">DLC</option>
                <option value="EXPANSION">Expansion</option>
                <option value="FREE_UPDATE">Free Update</option>
              </select>
              <ChevronDown size={14} className={styles.selectIcon} />
            </div>
            <Button type="submit" loading={creating}>
              Add DLC
            </Button>
          </form>

          {loading ? (
            <LoadingSpinner text="Loading DLCs..." />
          ) : (
            <>
              {dlcs.length > 0 && (
                <div className={styles.selectAllBar}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === dlcs.length && dlcs.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(dlcs.map((d: DLC) => d.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  <span className={styles.selectAllLabel}>Select all ({dlcs.length})</span>
                </div>
              )}

              <div className={styles.itemsGrid}>
                {dlcs.map((dlc: DLC) => (
                  <div
                    key={dlc.id}
                    className={`${styles.itemCard} ${selectedIds.has(dlc.id) ? styles.selected : ""}`}
                  >
                    {editingId === dlc.id ? (
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
                              await updateDLC({
                                variables: {
                                  id: dlc.id,
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
                          checked={selectedIds.has(dlc.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedIds);
                            if (e.target.checked) newSet.add(dlc.id);
                            else newSet.delete(dlc.id);
                            setSelectedIds(newSet);
                          }}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{dlc.name}</span>
                          <span className={styles.itemSlug}>{dlc.slug}</span>
                          <span className={`${styles.badge} ${styles.badgeCount}`}>
                            {dlc.type.replace("_", " ")}
                          </span>
                        </div>
                        <div className={styles.itemActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => {
                              setEditingId(dlc.id);
                              setEditingName(dlc.name);
                              setEditingSlug(dlc.slug);
                            }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={async () => {
                              if (confirm(`Delete ${dlc.name}?`)) {
                                await deleteDLC({ variables: { id: dlc.id } });
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
                {dlcs.length === 0 && (
                  <p className={styles.itemMeta}>No DLCs for this game yet.</p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!selectedGameId && (
        <p className={styles.itemMeta}>Select a game to manage its DLCs.</p>
      )}
    </div>
  );
}
