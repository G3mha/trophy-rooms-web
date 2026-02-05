"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { GET_ME } from "@/graphql/queries";
import {
  GET_PLATFORMS,
  GET_GAMES_ADMIN,
  GET_ACHIEVEMENT_SETS_ADMIN,
  GET_ACHIEVEMENTS_ADMIN,
  GET_USERS_ADMIN,
} from "@/graphql/admin_queries";
import {
  CREATE_PLATFORM,
  UPDATE_PLATFORM,
  DELETE_PLATFORM,
  CREATE_GAME,
  UPDATE_GAME,
  DELETE_GAME,
  CREATE_ACHIEVEMENT_SET,
  UPDATE_ACHIEVEMENT_SET,
  DELETE_ACHIEVEMENT_SET,
  CREATE_ACHIEVEMENT,
  UPDATE_ACHIEVEMENT,
  DELETE_ACHIEVEMENT,
  SET_USER_ROLE,
  BULK_CREATE_ACHIEVEMENTS,
} from "@/graphql/admin_mutations";
import { Button, LoadingSpinner, EmptyState } from "@/components";

export default function AdminPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const { data: meData, loading: meLoading } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";

  const {
    data: platformsData,
    loading: platformsLoading,
    refetch: refetchPlatforms,
  } = useQuery(GET_PLATFORMS);

  const {
    data: gamesData,
    loading: gamesLoading,
    refetch: refetchGames,
  } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 100, orderBy: "TITLE_ASC" },
  });

  const {
    data: setsData,
    loading: setsLoading,
    refetch: refetchSets,
  } = useQuery(GET_ACHIEVEMENT_SETS_ADMIN);

  const [selectedSetId, setSelectedSetId] = useState<string>("");

  const {
    data: achievementsData,
    loading: achievementsLoading,
    refetch: refetchAchievements,
  } = useQuery(GET_ACHIEVEMENTS_ADMIN, {
    variables: {
      first: 100,
      filter: selectedSetId ? { achievementSetId: selectedSetId } : undefined,
      orderBy: "TITLE_ASC",
    },
    skip: !selectedSetId,
  });

  const [createPlatform, { loading: creatingPlatform }] = useMutation(
    CREATE_PLATFORM,
    {
      onCompleted: () => refetchPlatforms(),
    }
  );
  const [updatePlatform] = useMutation(UPDATE_PLATFORM, {
    onCompleted: () => refetchPlatforms(),
  });
  const [deletePlatform] = useMutation(DELETE_PLATFORM, {
    onCompleted: () => refetchPlatforms(),
  });

  const [createGame, { loading: creatingGame }] = useMutation(CREATE_GAME, {
    onCompleted: () => refetchGames(),
  });
  const [updateGame] = useMutation(UPDATE_GAME, {
    onCompleted: () => refetchGames(),
  });
  const [deleteGame] = useMutation(DELETE_GAME, {
    onCompleted: () => refetchGames(),
  });

  const [createSet, { loading: creatingSet }] = useMutation(
    CREATE_ACHIEVEMENT_SET,
    {
      onCompleted: () => refetchSets(),
    }
  );
  const [updateSet] = useMutation(UPDATE_ACHIEVEMENT_SET, {
    onCompleted: () => refetchSets(),
  });
  const [deleteSet] = useMutation(DELETE_ACHIEVEMENT_SET, {
    onCompleted: () => refetchSets(),
  });

  const [createAchievement, { loading: creatingAchievement }] = useMutation(
    CREATE_ACHIEVEMENT,
    {
      onCompleted: () => refetchAchievements(),
    }
  );
  const [bulkCreateAchievements, { loading: importingAchievements }] =
    useMutation(BULK_CREATE_ACHIEVEMENTS, {
      onCompleted: () => refetchAchievements(),
    });
  const [updateAchievement] = useMutation(UPDATE_ACHIEVEMENT, {
    onCompleted: () => refetchAchievements(),
  });
  const [deleteAchievement] = useMutation(DELETE_ACHIEVEMENT, {
    onCompleted: () => refetchAchievements(),
  });

  const [userSearch, setUserSearch] = useState("");
  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(GET_USERS_ADMIN, {
    variables: { first: 100, search: userSearch || undefined },
  });
  const [setUserRole, { loading: updatingRole }] = useMutation(SET_USER_ROLE, {
    onCompleted: () => refetchUsers(),
  });

  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformSlug, setNewPlatformSlug] = useState("");
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [editingPlatformName, setEditingPlatformName] = useState("");
  const [editingPlatformSlug, setEditingPlatformSlug] = useState("");

  const [newGameTitle, setNewGameTitle] = useState("");
  const [newGameDescription, setNewGameDescription] = useState("");
  const [newGameCoverUrl, setNewGameCoverUrl] = useState("");
  const [newGamePlatformId, setNewGamePlatformId] = useState("");
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editingGameTitle, setEditingGameTitle] = useState("");
  const [editingGameDescription, setEditingGameDescription] = useState("");
  const [editingGameCoverUrl, setEditingGameCoverUrl] = useState("");
  const [editingGamePlatformId, setEditingGamePlatformId] = useState("");

  const [newSetTitle, setNewSetTitle] = useState("");
  const [newSetType, setNewSetType] = useState("OFFICIAL");
  const [newSetGameId, setNewSetGameId] = useState("");
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetTitle, setEditingSetTitle] = useState("");
  const [editingSetVisibility, setEditingSetVisibility] = useState("PRIVATE");

  const [newAchievementSetId, setNewAchievementSetId] = useState("");
  const [newAchievementTitle, setNewAchievementTitle] = useState("");
  const [newAchievementDescription, setNewAchievementDescription] = useState("");
  const [newAchievementPoints, setNewAchievementPoints] = useState("0");
  const [newAchievementIconUrl, setNewAchievementIconUrl] = useState("");
  const [editingAchievementId, setEditingAchievementId] = useState<string | null>(
    null
  );
  const [editingAchievementTitle, setEditingAchievementTitle] = useState("");
  const [editingAchievementDescription, setEditingAchievementDescription] =
    useState("");
  const [editingAchievementPoints, setEditingAchievementPoints] = useState("0");
  const [editingAchievementIconUrl, setEditingAchievementIconUrl] =
    useState("");

  const [csvSetId, setCsvSetId] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvRows, setCsvRows] = useState<
    { title: string; description?: string | null; points?: number; iconUrl?: string | null }[]
  >([]);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSetId) {
      setNewAchievementSetId(selectedSetId);
      setCsvSetId(selectedSetId);
    }
  }, [selectedSetId]);

  const platforms = platformsData?.platforms ?? [];
  const games = gamesData?.games?.edges?.map((edge: any) => edge.node) ?? [];
  const sets = setsData?.achievementSets ?? [];
  const achievements =
    achievementsData?.achievements?.edges?.map((edge: any) => edge.node) ?? [];
  const users =
    usersData?.users?.edges?.map((edge: any) => edge.node) ?? [];

  const parseCsv = (text: string) => {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];

      if (char === "\"") {
        if (inQuotes && text[i + 1] === "\"") {
          current += "\"";
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(current);
        current = "";
      } else if ((char === "\n" || char === "\r") && !inQuotes) {
        if (char === "\r" && text[i + 1] === "\n") {
          i += 1;
        }
        row.push(current);
        current = "";
        if (row.some((cell) => cell.trim().length > 0)) {
          rows.push(row);
        }
        row = [];
      } else {
        current += char;
      }
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current);
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleCsvFile = async (file: File | null) => {
    if (!file) {
      setCsvFileName("");
      setCsvRows([]);
      setCsvError(null);
      return;
    }

    setCsvResult(null);
    setCsvError(null);
    setCsvFileName(file.name);

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0) {
      setCsvError("CSV file is empty.");
      setCsvRows([]);
      return;
    }

    const header = rows[0].map((cell) => cell.trim().toLowerCase());
    const titleIndex = header.indexOf("title");
    const descriptionIndex = header.indexOf("description");
    const pointsIndex = header.indexOf("points");
    const iconIndex = header.indexOf("iconurl");

    if (titleIndex === -1) {
      setCsvError("CSV must include a 'title' column.");
      setCsvRows([]);
      return;
    }

    const parsed = rows.slice(1).map((row) => {
      const title = row[titleIndex]?.trim() ?? "";
      const description = descriptionIndex >= 0 ? row[descriptionIndex]?.trim() || null : null;
      const points = pointsIndex >= 0 ? Number.parseInt(row[pointsIndex] ?? "0", 10) || 0 : 0;
      const iconUrl = iconIndex >= 0 ? row[iconIndex]?.trim() || null : null;

      return { title, description, points, iconUrl };
    }).filter((row) => row.title.length > 0);

    if (!parsed.length) {
      setCsvError("No valid rows found in CSV.");
      setCsvRows([]);
      return;
    }

    setCsvRows(parsed);
  };

  if (!isLoaded) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (meLoading) {
    return <LoadingSpinner text="Checking access..." />;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <EmptyState
          icon="🔒"
          title="Admin Access Required"
          description="You don’t have permission to access the admin dashboard."
          action={<Button href="/">Back Home</Button>}
        />
      </div>
    );
  }

  if (platformsLoading || gamesLoading || setsLoading || usersLoading) {
    return <LoadingSpinner text="Loading admin data..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400">
          Manage platforms, games, achievement sets, and achievements.
        </p>
      </header>

      <section className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Platforms</h2>
          <p className="text-sm text-gray-400">Create and manage platforms.</p>
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
          className="grid gap-4 md:grid-cols-3"
        >
          <input
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            placeholder="Platform name"
            value={newPlatformName}
            onChange={(event) => setNewPlatformName(event.target.value)}
          />
          <input
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            placeholder="Platform slug"
            value={newPlatformSlug}
            onChange={(event) => setNewPlatformSlug(event.target.value)}
          />
          <Button type="submit" loading={creatingPlatform}>
            Add Platform
          </Button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {platforms.map((platform: any) => (
            <div
              key={platform.id}
              className="border border-[#3D3D3D] rounded-xl p-4 bg-[#0E0E0E] space-y-3"
            >
              {editingPlatformId === platform.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    value={editingPlatformName}
                    onChange={(event) =>
                      setEditingPlatformName(event.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    value={editingPlatformSlug}
                    onChange={(event) =>
                      setEditingPlatformSlug(event.target.value)
                    }
                  />
                  <div className="flex gap-3">
                    <Button
                      size="sm"
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
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingPlatformId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {platform.name}
                    </h3>
                    <p className="text-xs text-gray-400">{platform.slug}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingPlatformId(platform.id);
                        setEditingPlatformName(platform.name);
                        setEditingPlatformSlug(platform.slug);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () =>
                        deletePlatform({ variables: { id: platform.id } })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Users & Roles</h2>
          <p className="text-sm text-gray-400">
            Promote users to Trusted or Admin roles.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            placeholder="Search by name or email"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {users.map((user: any) => (
            <div
              key={user.id}
              className="border border-[#3D3D3D] rounded-xl p-4 bg-[#0E0E0E] space-y-3"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {user.name || "Unnamed User"}
                </h3>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="flex gap-3 items-center">
                <select
                  className="rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                  value={user.role}
                  onChange={(event) =>
                    setUserRole({
                      variables: { userId: user.id, role: event.target.value },
                    })
                  }
                  disabled={updatingRole}
                >
                  <option value="USER">User</option>
                  <option value="TRUSTED">Trusted</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <span className="text-xs text-gray-400">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-gray-400">
              No users found for this search.
            </p>
          )}
        </div>
      </section>

      <section className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Games</h2>
          <p className="text-sm text-gray-400">
            Create games and assign platforms.
          </p>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!newGameTitle) return;
            await createGame({
              variables: {
                input: {
                  title: newGameTitle,
                  description: newGameDescription || null,
                  coverUrl: newGameCoverUrl || null,
                  platformId: newGamePlatformId || null,
                },
              },
            });
            setNewGameTitle("");
            setNewGameDescription("");
            setNewGameCoverUrl("");
            setNewGamePlatformId("");
          }}
          className="grid gap-4 md:grid-cols-2"
        >
          <input
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            placeholder="Game title"
            value={newGameTitle}
            onChange={(event) => setNewGameTitle(event.target.value)}
          />
          <select
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            value={newGamePlatformId}
            onChange={(event) => setNewGamePlatformId(event.target.value)}
          >
            <option value="">No platform</option>
            {platforms.map((platform: any) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm md:col-span-2"
            placeholder="Description"
            value={newGameDescription}
            onChange={(event) => setNewGameDescription(event.target.value)}
          />
          <input
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm md:col-span-2"
            placeholder="Cover URL"
            value={newGameCoverUrl}
            onChange={(event) => setNewGameCoverUrl(event.target.value)}
          />
          <Button type="submit" loading={creatingGame}>
            Add Game
          </Button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game: any) => (
            <div
              key={game.id}
              className="border border-[#3D3D3D] rounded-xl p-4 bg-[#0E0E0E] space-y-3"
            >
              {editingGameId === game.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    value={editingGameTitle}
                    onChange={(event) => setEditingGameTitle(event.target.value)}
                  />
                  <textarea
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    rows={3}
                    value={editingGameDescription}
                    onChange={(event) =>
                      setEditingGameDescription(event.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    value={editingGameCoverUrl}
                    onChange={(event) =>
                      setEditingGameCoverUrl(event.target.value)
                    }
                  />
                  <select
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    value={editingGamePlatformId}
                    onChange={(event) =>
                      setEditingGamePlatformId(event.target.value)
                    }
                  >
                    <option value="">No platform</option>
                    {platforms.map((platform: any) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await updateGame({
                          variables: {
                            id: game.id,
                            input: {
                              title: editingGameTitle,
                              description: editingGameDescription || null,
                              coverUrl: editingGameCoverUrl || null,
                              platformId: editingGamePlatformId || null,
                            },
                          },
                        });
                        setEditingGameId(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingGameId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {game.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {game.platform?.name || "No platform"}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingGameId(game.id);
                        setEditingGameTitle(game.title);
                        setEditingGameDescription(game.description || "");
                        setEditingGameCoverUrl(game.coverUrl || "");
                        setEditingGamePlatformId(game.platform?.id || "");
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () =>
                        deleteGame({ variables: { id: game.id } })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Achievement Sets</h2>
          <p className="text-sm text-gray-400">
            Create and manage official, completionist, and custom sets.
          </p>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (!newSetTitle || !newSetGameId) return;
            await createSet({
              variables: {
                input: {
                  title: newSetTitle,
                  type: newSetType,
                  gameId: newSetGameId,
                },
              },
            });
            setNewSetTitle("");
            setNewSetGameId("");
            setNewSetType("OFFICIAL");
          }}
          className="grid gap-4 md:grid-cols-3"
        >
          <input
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            placeholder="Set title"
            value={newSetTitle}
            onChange={(event) => setNewSetTitle(event.target.value)}
          />
          <select
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            value={newSetType}
            onChange={(event) => setNewSetType(event.target.value)}
          >
            <option value="OFFICIAL">Official</option>
            <option value="COMPLETIONIST">Completionist</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <select
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            value={newSetGameId}
            onChange={(event) => setNewSetGameId(event.target.value)}
          >
            <option value="">Select game</option>
            {games.map((game: any) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
          <Button type="submit" loading={creatingSet}>
            Add Set
          </Button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {sets.map((set: any) => (
            <div
              key={set.id}
              className="border border-[#3D3D3D] rounded-xl p-4 bg-[#0E0E0E] space-y-3"
            >
              {editingSetId === set.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    value={editingSetTitle}
                    onChange={(event) => setEditingSetTitle(event.target.value)}
                  />
                  <select
                    className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                    value={editingSetVisibility}
                    onChange={(event) =>
                      setEditingSetVisibility(event.target.value)
                    }
                    disabled={set.type !== "CUSTOM"}
                  >
                    <option value="PRIVATE">Private</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await updateSet({
                          variables: {
                            id: set.id,
                            input: {
                              title: editingSetTitle,
                              visibility:
                                set.type === "CUSTOM"
                                  ? editingSetVisibility
                                  : undefined,
                            },
                          },
                        });
                        setEditingSetId(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingSetId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {set.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {set.type} · {set.visibility.toLowerCase()} · {set.game.title}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingSetId(set.id);
                        setEditingSetTitle(set.title);
                        setEditingSetVisibility(set.visibility);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () =>
                        deleteSet({ variables: { id: set.id } })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Achievements</h2>
          <p className="text-sm text-gray-400">
            Manage achievements within a set.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <select
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            value={selectedSetId}
            onChange={(event) => setSelectedSetId(event.target.value)}
          >
            <option value="">Select set to view</option>
            {sets.map((set: any) => (
              <option key={set.id} value={set.id}>
                {set.title} ({set.game.title})
              </option>
            ))}
          </select>
        </div>

        {sets.length === 0 && (
          <p className="text-sm text-gray-400">
            Create an achievement set first to add achievements.
          </p>
        )}

        {sets.length > 0 && (
          <div className="border border-dashed border-[#3D3D3D] rounded-xl p-4 bg-[#0E0E0E] space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Bulk Import (CSV)</h3>
              <p className="text-xs text-gray-400">
                Columns: title, description, points, iconUrl
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                className="rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                value={csvSetId}
                onChange={(event) => setCsvSetId(event.target.value)}
              >
                <option value="">Select set</option>
                {sets.map((set: any) => (
                  <option key={set.id} value={set.id}>
                    {set.title}
                  </option>
                ))}
              </select>
              <input
                type="file"
                accept=".csv"
                className="rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                onChange={(event) =>
                  handleCsvFile(event.target.files?.[0] ?? null)
                }
              />
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!csvSetId) {
                    setCsvError("Select an achievement set.");
                    return;
                  }
                  if (!csvRows.length) {
                    setCsvError("Upload a CSV with at least one row.");
                    return;
                  }
                  setCsvError(null);
                  const result = await bulkCreateAchievements({
                    variables: {
                      achievementSetId: csvSetId,
                      achievements: csvRows,
                    },
                  });
                  if (result.data?.bulkCreateAchievements?.success) {
                    setCsvResult(
                      `Imported ${result.data.bulkCreateAchievements.createdCount} achievements, skipped ${result.data.bulkCreateAchievements.skippedCount}.`
                    );
                    setCsvFileName("");
                    setCsvRows([]);
                  } else {
                    setCsvError(
                      result.data?.bulkCreateAchievements?.error?.message ||
                        "Import failed."
                    );
                  }
                }}
                loading={importingAchievements}
              >
                Import CSV
              </Button>
            </div>
            {csvFileName && (
              <p className="text-xs text-gray-400">
                Loaded: {csvFileName} ({csvRows.length} rows)
              </p>
            )}
            {csvError && <p className="text-xs text-red-400">{csvError}</p>}
            {csvResult && <p className="text-xs text-green-400">{csvResult}</p>}
          </div>
        )}

        {sets.length > 0 && (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newAchievementSetId || !newAchievementTitle) return;
              await createAchievement({
                variables: {
                  input: {
                    achievementSetId: newAchievementSetId,
                    title: newAchievementTitle,
                    description: newAchievementDescription || null,
                    iconUrl: newAchievementIconUrl || null,
                    points: Number.parseInt(newAchievementPoints, 10) || 0,
                  },
                },
              });
              setNewAchievementTitle("");
              setNewAchievementDescription("");
              setNewAchievementIconUrl("");
              setNewAchievementPoints("0");
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <select
              className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
              value={newAchievementSetId}
              onChange={(event) => setNewAchievementSetId(event.target.value)}
            >
              <option value="">Select set</option>
              {sets.map((set: any) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
              placeholder="Achievement title"
              value={newAchievementTitle}
              onChange={(event) => setNewAchievementTitle(event.target.value)}
            />
            <input
              className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm md:col-span-2"
              placeholder="Description"
              value={newAchievementDescription}
              onChange={(event) =>
                setNewAchievementDescription(event.target.value)
              }
            />
            <input
              className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
              placeholder="Points"
              value={newAchievementPoints}
              onChange={(event) => setNewAchievementPoints(event.target.value)}
              type="number"
              min="0"
            />
            <input
              className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
              placeholder="Icon URL"
              value={newAchievementIconUrl}
              onChange={(event) => setNewAchievementIconUrl(event.target.value)}
            />
            <Button type="submit" loading={creatingAchievement}>
              Add Achievement
            </Button>
          </form>
        )}

        {selectedSetId && achievementsLoading && (
          <LoadingSpinner text="Loading achievements..." />
        )}

        {selectedSetId && !achievementsLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement: any) => (
              <div
                key={achievement.id}
                className="border border-[#3D3D3D] rounded-xl p-4 bg-[#0E0E0E] space-y-3"
              >
                {editingAchievementId === achievement.id ? (
                  <div className="space-y-2">
                    <input
                      className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                      value={editingAchievementTitle}
                      onChange={(event) =>
                        setEditingAchievementTitle(event.target.value)
                      }
                    />
                    <textarea
                      className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                      rows={3}
                      value={editingAchievementDescription}
                      onChange={(event) =>
                        setEditingAchievementDescription(event.target.value)
                      }
                    />
                    <input
                      className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                      value={editingAchievementPoints}
                      onChange={(event) =>
                        setEditingAchievementPoints(event.target.value)
                      }
                      type="number"
                      min="0"
                    />
                    <input
                      className="w-full rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm"
                      value={editingAchievementIconUrl}
                      onChange={(event) =>
                        setEditingAchievementIconUrl(event.target.value)
                      }
                    />
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        onClick={async () => {
                          await updateAchievement({
                            variables: {
                              id: achievement.id,
                              input: {
                                title: editingAchievementTitle,
                                description: editingAchievementDescription || null,
                                iconUrl: editingAchievementIconUrl || null,
                                points:
                                  Number.parseInt(editingAchievementPoints, 10) ||
                                  0,
                              },
                            },
                          });
                          setEditingAchievementId(null);
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingAchievementId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {achievement.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {achievement.points} points
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingAchievementId(achievement.id);
                          setEditingAchievementTitle(achievement.title);
                          setEditingAchievementDescription(
                            achievement.description || ""
                          );
                          setEditingAchievementPoints(
                            String(achievement.points || 0)
                          );
                          setEditingAchievementIconUrl(
                            achievement.iconUrl || ""
                          );
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () =>
                          deleteAchievement({
                            variables: { id: achievement.id },
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-gray-400">
                No achievements in this set yet.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
