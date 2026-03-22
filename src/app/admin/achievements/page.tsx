"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ACHIEVEMENT_SETS_ADMIN, GET_ACHIEVEMENTS_ADMIN } from "@/graphql/admin_queries";
import {
  CREATE_ACHIEVEMENT,
  UPDATE_ACHIEVEMENT,
  DELETE_ACHIEVEMENT,
  BULK_DELETE_ACHIEVEMENTS,
  BULK_CREATE_ACHIEVEMENTS,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X, Upload } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import styles from "../page.module.css";

interface AchievementSet {
  id: string;
  title: string;
  game?: { title: string } | null;
}

interface Achievement {
  id: string;
  title: string;
  description?: string | null;
  points?: number | null;
  tier?: string | null;
}

export default function AdminAchievementsPage() {
  const [selectedSetId, setSelectedSetId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPoints, setNewPoints] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [csvData, setCsvData] = useState("");
  const [showImport, setShowImport] = useState(false);

  const { data: setsData } = useQuery(GET_ACHIEVEMENT_SETS_ADMIN);

  const {
    data: achievementsData,
    loading,
    refetch,
  } = useQuery(GET_ACHIEVEMENTS_ADMIN, {
    variables: {
      first: 100,
      filter: selectedSetId ? { achievementSetId: selectedSetId } : undefined,
      orderBy: "TITLE_ASC",
    },
    skip: !selectedSetId,
  });

  const [createAchievement, { loading: creating }] = useMutation(CREATE_ACHIEVEMENT, {
    onCompleted: () => refetch(),
  });
  const [updateAchievement] = useMutation(UPDATE_ACHIEVEMENT, {
    onCompleted: () => refetch(),
  });
  const [deleteAchievement] = useMutation(DELETE_ACHIEVEMENT, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_ACHIEVEMENTS, {
    onCompleted: () => { refetch(); setSelectedIds(new Set()); },
  });
  const [bulkCreate, { loading: importing }] = useMutation(BULK_CREATE_ACHIEVEMENTS, {
    onCompleted: () => { refetch(); setCsvData(""); setShowImport(false); },
  });

  const sets = setsData?.achievementSets || [];
  const achievements = achievementsData?.achievements?.edges?.map((e: { node: Achievement }) => e.node) || [];

  const handleImport = async () => {
    if (!csvData || !selectedSetId) return;
    const lines = csvData.trim().split("\n");
    const achievements = lines.map((line) => {
      const [title, description, points] = line.split(",").map((s) => s.trim());
      return {
        title,
        description: description || null,
        points: points ? parseInt(points) : 0,
        achievementSetId: selectedSetId,
      };
    });
    await bulkCreate({ variables: { input: { achievements } } });
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Achievements</h1>
          <p className={styles.sectionSubtitle}>Manage individual achievements.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {selectedSetId && (
            <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)}>
              <Upload size={14} />
              Import CSV
            </Button>
          )}
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={bulkDeleting}
              onClick={async () => {
                if (confirm(`Delete ${selectedIds.size} achievement(s)?`)) {
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

      <div style={{ marginBottom: 20 }}>
        <select
          className={styles.input}
          style={{ maxWidth: 400 }}
          value={selectedSetId}
          onChange={(e) => {
            setSelectedSetId(e.target.value);
            setSelectedIds(new Set());
          }}
        >
          <option value="">Select an achievement set...</option>
          {sets.map((s: AchievementSet) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.game?.title || "No game"})
            </option>
          ))}
        </select>
      </div>

      {showImport && selectedSetId && (
        <div style={{ marginBottom: 20, padding: 16, background: "var(--bg-secondary)", borderRadius: 8 }}>
          <p style={{ marginBottom: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            Paste CSV data (title,description,points per line):
          </p>
          <textarea
            className={styles.input}
            style={{ width: "100%", minHeight: 100, marginBottom: 8 }}
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="Beat the game,Complete the main story,100&#10;Find all secrets,Discover every hidden item,50"
          />
          <Button loading={importing} onClick={handleImport}>
            Import Achievements
          </Button>
        </div>
      )}

      {selectedSetId && (
        <>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newTitle) return;
              await createAchievement({
                variables: {
                  input: {
                    title: newTitle,
                    description: newDescription || null,
                    points: newPoints ? parseInt(newPoints) : 0,
                    achievementSetId: selectedSetId,
                  },
                },
              });
              setNewTitle("");
              setNewDescription("");
              setNewPoints("");
            }}
            className={`${styles.formRow} ${styles.formRow3Col}`}
          >
            <input
              className={styles.input}
              placeholder="Achievement title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <input
              className={styles.input}
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <input
              className={styles.input}
              placeholder="Points"
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
            />
            <Button type="submit" loading={creating}>
              Add
            </Button>
          </form>

          {loading ? (
            <LoadingSpinner text="Loading achievements..." />
          ) : (
            <>
              {achievements.length > 0 && (
                <div className={styles.selectAllBar}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === achievements.length && achievements.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(achievements.map((a: Achievement) => a.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  <span className={styles.selectAllLabel}>Select all ({achievements.length})</span>
                </div>
              )}

              <div className={styles.itemsGrid}>
                {achievements.map((achievement: Achievement) => (
                  <div
                    key={achievement.id}
                    className={`${styles.itemCard} ${selectedIds.has(achievement.id) ? styles.selected : ""}`}
                  >
                    {editingId === achievement.id ? (
                      <div className={styles.editForm}>
                        <input
                          className={styles.editInput}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          placeholder="Title"
                        />
                        <input
                          className={styles.editInput}
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          placeholder="Description"
                        />
                        <div className={styles.editActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={async () => {
                              await updateAchievement({
                                variables: {
                                  id: achievement.id,
                                  input: {
                                    title: editingTitle,
                                    description: editingDescription || null,
                                  },
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
                          checked={selectedIds.has(achievement.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedIds);
                            if (e.target.checked) newSet.add(achievement.id);
                            else newSet.delete(achievement.id);
                            setSelectedIds(newSet);
                          }}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{achievement.title}</span>
                          {achievement.description && (
                            <span className={styles.itemMeta}>{achievement.description}</span>
                          )}
                        </div>
                        <span className={styles.itemSlug}>{achievement.points || 0} pts</span>
                        <div className={styles.itemActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => {
                              setEditingId(achievement.id);
                              setEditingTitle(achievement.title);
                              setEditingDescription(achievement.description || "");
                            }}
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={async () => {
                              if (confirm(`Delete ${achievement.title}?`)) {
                                await deleteAchievement({ variables: { id: achievement.id } });
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
                {achievements.length === 0 && (
                  <p className={styles.itemMeta}>No achievements in this set yet.</p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {!selectedSetId && (
        <p className={styles.itemMeta}>Select an achievement set to manage its achievements.</p>
      )}
    </div>
  );
}
