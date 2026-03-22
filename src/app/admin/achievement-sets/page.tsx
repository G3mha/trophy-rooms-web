"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_GAMES_ADMIN, GET_ACHIEVEMENT_SETS_ADMIN } from "@/graphql/admin_queries";
import {
  CREATE_ACHIEVEMENT_SET,
  UPDATE_ACHIEVEMENT_SET,
  DELETE_ACHIEVEMENT_SET,
  BULK_DELETE_ACHIEVEMENT_SETS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import styles from "../page.module.css";

interface Game {
  id: string;
  title: string;
}

interface AchievementSet {
  id: string;
  title: string;
  type: string;
  visibility: string;
  achievementCount: number;
  game?: { id: string; title: string } | null;
}

export default function AdminAchievementSetsPage() {
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("OFFICIAL");
  const [newGameId, setNewGameId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: gamesData } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 500, orderBy: "TITLE_ASC" },
  });

  const {
    data: setsData,
    loading,
    refetch,
  } = useQuery(GET_ACHIEVEMENT_SETS_ADMIN);

  const [createSet, { loading: creating }] = useMutation(CREATE_ACHIEVEMENT_SET, {
    onCompleted: () => refetch(),
  });
  const [updateSet] = useMutation(UPDATE_ACHIEVEMENT_SET, {
    onCompleted: () => refetch(),
  });
  const [deleteSet] = useMutation(DELETE_ACHIEVEMENT_SET, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_ACHIEVEMENT_SETS, {
    onCompleted: () => { refetch(); setSelectedIds(new Set()); },
  });

  const games = gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];
  const sets = setsData?.achievementSets || [];

  if (loading && sets.length === 0) {
    return <LoadingSpinner text="Loading achievement sets..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Achievement Sets</h1>
          <p className={styles.sectionSubtitle}>Create and manage achievement sets for games.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={bulkDeleting}
            onClick={async () => {
              if (confirm(`Delete ${selectedIds.size} set(s)?`)) {
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
          if (!newTitle || !newGameId) return;
          await createSet({
            variables: {
              input: {
                title: newTitle,
                type: newType,
                gameId: newGameId,
              },
            },
          });
          setNewTitle("");
        }}
        className={`${styles.formRow} ${styles.formRow3Col}`}
      >
        <input
          className={styles.input}
          placeholder="Set title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <select
          className={styles.input}
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
        >
          <option value="OFFICIAL">Official</option>
          <option value="COMPLETIONIST">Completionist</option>
          <option value="CUSTOM">Custom</option>
        </select>
        <select
          className={styles.input}
          value={newGameId}
          onChange={(e) => setNewGameId(e.target.value)}
        >
          <option value="">Select game</option>
          {games.map((g: Game) => (
            <option key={g.id} value={g.id}>{g.title}</option>
          ))}
        </select>
        <Button type="submit" loading={creating}>
          Add Set
        </Button>
      </form>

      {sets.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === sets.length && sets.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(sets.map((s: AchievementSet) => s.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>Select all ({sets.length})</span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {sets.map((set: AchievementSet) => (
          <div
            key={set.id}
            className={`${styles.itemCard} ${selectedIds.has(set.id) ? styles.selected : ""}`}
          >
            {editingId === set.id ? (
              <div className={styles.editForm}>
                <input
                  className={styles.editInput}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Title"
                />
                <div className={styles.editActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={async () => {
                      await updateSet({
                        variables: {
                          id: set.id,
                          input: { title: editingTitle },
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
                  checked={selectedIds.has(set.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedIds);
                    if (e.target.checked) newSet.add(set.id);
                    else newSet.delete(set.id);
                    setSelectedIds(newSet);
                  }}
                />
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{set.title}</span>
                  <span className={styles.itemSlug}>{set.game?.title || "No game"}</span>
                  <span className={`${styles.badge} ${styles.badgeCount}`}>{set.type}</span>
                </div>
                <span className={styles.itemMeta}>{set.achievementCount} achievements</span>
                <div className={styles.itemActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      setEditingId(set.id);
                      setEditingTitle(set.title);
                    }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={async () => {
                      if (confirm(`Delete ${set.title}?`)) {
                        await deleteSet({ variables: { id: set.id } });
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
