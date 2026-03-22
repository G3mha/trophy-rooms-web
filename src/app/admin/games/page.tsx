"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_GAMES_ADMIN, GET_PLATFORMS } from "@/graphql/admin_queries";
import {
  CREATE_GAME,
  UPDATE_GAME,
  DELETE_GAME,
  BULK_DELETE_GAMES,
} from "@/graphql/admin_mutations";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Button, LoadingSpinner } from "@/components";
import styles from "../page.module.css";

interface Platform {
  id: string;
  name: string;
}

interface Game {
  id: string;
  title: string;
  slug: string;
  platform?: Platform | null;
  type?: string;
  achievementCount: number;
}

export default function AdminGamesPage() {
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPlatformId, setNewPlatformId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: platformsData } = useQuery(GET_PLATFORMS);
  const {
    data: gamesData,
    loading,
    refetch,
  } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 100, orderBy: "TITLE_ASC" },
  });

  const [createGame, { loading: creating }] = useMutation(CREATE_GAME, {
    onCompleted: () => refetch(),
  });
  const [updateGame] = useMutation(UPDATE_GAME, {
    onCompleted: () => refetch(),
  });
  const [deleteGame] = useMutation(DELETE_GAME, {
    onCompleted: () => refetch(),
  });
  const [bulkDelete, { loading: bulkDeleting }] = useMutation(BULK_DELETE_GAMES, {
    onCompleted: () => { refetch(); setSelectedIds(new Set()); },
  });

  const platforms = platformsData?.platforms || [];
  const games = gamesData?.games?.edges?.map((e: { node: Game }) => e.node) || [];

  if (loading && games.length === 0) {
    return <LoadingSpinner text="Loading games..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Games</h1>
          <p className={styles.sectionSubtitle}>Create and manage games.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button
            variant="outline"
            size="sm"
            loading={bulkDeleting}
            onClick={async () => {
              if (confirm(`Delete ${selectedIds.size} game(s)?`)) {
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
          if (!newTitle || !newSlug || !newPlatformId) return;
          await createGame({
            variables: {
              input: {
                title: newTitle,
                slug: newSlug,
                platformId: newPlatformId,
              },
            },
          });
          setNewTitle("");
          setNewSlug("");
        }}
        className={`${styles.formRow} ${styles.formRow3Col}`}
      >
        <input
          className={styles.input}
          placeholder="Game title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Slug"
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
        />
        <select
          className={styles.input}
          value={newPlatformId}
          onChange={(e) => setNewPlatformId(e.target.value)}
        >
          <option value="">Select platform</option>
          {platforms.map((p: Platform) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <Button type="submit" loading={creating}>
          Add Game
        </Button>
      </form>

      {games.length > 0 && (
        <div className={styles.selectAllBar}>
          <input
            type="checkbox"
            checked={selectedIds.size === games.length && games.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(new Set(games.map((g: Game) => g.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
          />
          <span className={styles.selectAllLabel}>Select all ({games.length})</span>
        </div>
      )}

      <div className={styles.itemsGrid}>
        {games.map((game: Game) => (
          <div
            key={game.id}
            className={`${styles.itemCard} ${selectedIds.has(game.id) ? styles.selected : ""}`}
          >
            {editingId === game.id ? (
              <div className={styles.editForm}>
                <input
                  className={styles.editInput}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  placeholder="Title"
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
                      await updateGame({
                        variables: {
                          id: game.id,
                          input: { title: editingTitle, slug: editingSlug },
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
                  checked={selectedIds.has(game.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedIds);
                    if (e.target.checked) newSet.add(game.id);
                    else newSet.delete(game.id);
                    setSelectedIds(newSet);
                  }}
                />
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{game.title}</span>
                  <span className={styles.itemSlug}>{game.platform?.name || "No platform"}</span>
                  {game.type && game.type !== "BASE_GAME" && (
                    <span className={styles.badge}>{game.type.replace("_", " ")}</span>
                  )}
                </div>
                <span className={styles.itemMeta}>{game.achievementCount} achievements</span>
                <div className={styles.itemActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      setEditingId(game.id);
                      setEditingTitle(game.title);
                      setEditingSlug(game.slug);
                    }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.danger}`}
                    onClick={async () => {
                      if (confirm(`Delete ${game.title}?`)) {
                        await deleteGame({ variables: { id: game.id } });
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
