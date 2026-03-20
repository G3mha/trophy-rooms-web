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
  GET_GAME_VERSIONS,
} from "@/graphql/admin_queries";
import {
  CREATE_PLATFORM,
  UPDATE_PLATFORM,
  DELETE_PLATFORM,
  CREATE_GAME,
  UPDATE_GAME,
  DELETE_GAME,
  CREATE_GAME_VERSION,
  UPDATE_GAME_VERSION,
  DELETE_GAME_VERSION,
  SET_DEFAULT_VERSION,
  BULK_DELETE_GAME_VERSIONS,
  CREATE_ACHIEVEMENT_SET,
  UPDATE_ACHIEVEMENT_SET,
  DELETE_ACHIEVEMENT_SET,
  CREATE_ACHIEVEMENT,
  UPDATE_ACHIEVEMENT,
  DELETE_ACHIEVEMENT,
  SET_USER_ROLE,
  BULK_CREATE_ACHIEVEMENTS,
  BULK_DELETE_PLATFORMS,
  BULK_DELETE_GAMES,
  BULK_DELETE_ACHIEVEMENT_SETS,
  BULK_DELETE_ACHIEVEMENTS,
} from "@/graphql/admin_mutations";
import { Lock, Trash2, Star } from "lucide-react";
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

  // Bulk delete mutations
  const [bulkDeletePlatforms, { loading: bulkDeletingPlatforms }] = useMutation(
    BULK_DELETE_PLATFORMS,
    { onCompleted: () => { refetchPlatforms(); setSelectedPlatformIds(new Set()); } }
  );
  const [bulkDeleteGames, { loading: bulkDeletingGames }] = useMutation(
    BULK_DELETE_GAMES,
    { onCompleted: () => { refetchGames(); setSelectedGameIds(new Set()); } }
  );
  const [bulkDeleteSets, { loading: bulkDeletingSets }] = useMutation(
    BULK_DELETE_ACHIEVEMENT_SETS,
    { onCompleted: () => { refetchSets(); setSelectedSetIds(new Set()); } }
  );
  const [bulkDeleteAchievements, { loading: bulkDeletingAchievements }] = useMutation(
    BULK_DELETE_ACHIEVEMENTS,
    { onCompleted: () => { refetchAchievements(); setSelectedAchievementIds(new Set()); } }
  );

  // Game Versions state and mutations
  const [selectedVersionGameId, setSelectedVersionGameId] = useState<string>("");
  const {
    data: versionsData,
    loading: versionsLoading,
    refetch: refetchVersions,
  } = useQuery(GET_GAME_VERSIONS, {
    variables: { gameId: selectedVersionGameId },
    skip: !selectedVersionGameId,
  });

  const [createVersion, { loading: creatingVersion }] = useMutation(
    CREATE_GAME_VERSION,
    { onCompleted: () => refetchVersions() }
  );
  const [updateVersion] = useMutation(UPDATE_GAME_VERSION, {
    onCompleted: () => refetchVersions(),
  });
  const [deleteVersion] = useMutation(DELETE_GAME_VERSION, {
    onCompleted: () => refetchVersions(),
  });
  const [setDefaultVersion] = useMutation(SET_DEFAULT_VERSION, {
    onCompleted: () => refetchVersions(),
  });
  const [bulkDeleteVersions, { loading: bulkDeletingVersions }] = useMutation(
    BULK_DELETE_GAME_VERSIONS,
    { onCompleted: () => { refetchVersions(); setSelectedVersionIds(new Set()); } }
  );

  // Bulk selection state
  const [selectedVersionIds, setSelectedVersionIds] = useState<Set<string>>(new Set());
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<Set<string>>(new Set());
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [selectedAchievementIds, setSelectedAchievementIds] = useState<Set<string>>(new Set());

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
  const [newSetVersionId, setNewSetVersionId] = useState("");
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingSetTitle, setEditingSetTitle] = useState("");
  const [editingSetVisibility, setEditingSetVisibility] = useState("PRIVATE");

  // Fetch versions for the selected game in set form
  const { data: setGameVersionsData } = useQuery(GET_GAME_VERSIONS, {
    variables: { gameId: newSetGameId },
    skip: !newSetGameId,
  });
  const setGameVersions = setGameVersionsData?.gameVersions ?? [];

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

  // Game version form state
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionSlug, setNewVersionSlug] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [newVersionCoverUrl, setNewVersionCoverUrl] = useState("");
  const [newVersionDlc, setNewVersionDlc] = useState("");
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingVersionName, setEditingVersionName] = useState("");
  const [editingVersionSlug, setEditingVersionSlug] = useState("");
  const [editingVersionDescription, setEditingVersionDescription] = useState("");
  const [editingVersionCoverUrl, setEditingVersionCoverUrl] = useState("");
  const [editingVersionDlc, setEditingVersionDlc] = useState("");

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
  const versions = versionsData?.gameVersions ?? [];

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
          icon={<Lock size={48} />}
          title="Admin Access Required"
          description="You don't have permission to access the admin dashboard."
          action={<Button href="/">Back Home</Button>}
        />
      </div>
    );
  }

  if (platformsLoading || gamesLoading || setsLoading || usersLoading) {
    return <LoadingSpinner text="Loading admin data..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400">
          Manage platforms, games, achievement sets, and achievements.
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Platforms</h2>
            <p className="text-sm text-gray-400">Create and manage platforms.</p>
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
              <Trash2 size={16} className="mr-2" />
              Delete {selectedPlatformIds.size} selected
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

        {platforms.length > 0 && (
          <div className="flex items-center gap-3 pb-2 border-b border-[#3D3D3D]">
            <input
              type="checkbox"
              checked={selectedPlatformIds.size === platforms.length && platforms.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPlatformIds(new Set(platforms.map((p: any) => p.id)));
                } else {
                  setSelectedPlatformIds(new Set());
                }
              }}
              className="w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
            />
            <span className="text-sm text-gray-400">Select all ({platforms.length})</span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform: any) => (
            <div
              key={platform.id}
              className={`border rounded-lg p-4 space-y-3 transition-colors ${
                selectedPlatformIds.has(platform.id)
                  ? 'border-[#E60012] bg-[#E60012]/5'
                  : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3D3D3D]'
              }`}
            >
              {editingPlatformId === platform.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                    value={editingPlatformName}
                    onChange={(event) =>
                      setEditingPlatformName(event.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
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
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
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
                      className="mt-1 w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E] accent-[#E60012]"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {platform.name}
                      </h3>
                      <p className="text-xs text-gray-400">{platform.slug}</p>
                    </div>
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

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Users & Roles</h2>
          <p className="text-sm text-gray-400">
            Promote users to Trusted or Admin roles.
          </p>
        </div>

        <div className="max-w-md">
          <input
            className="w-full rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
            placeholder="Search by name or email"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user: any) => (
            <div
              key={user.id}
              className="border border-[#2A2A2A] rounded-lg p-4 bg-[#1A1A1A] hover:border-[#3D3D3D] transition-colors space-y-3"
            >
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {user.name || "Unnamed User"}
                </h3>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="flex gap-3 items-center">
                <select
                  className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white focus:border-[#E60012] focus:outline-none"
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
                <span className="text-xs text-gray-500">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-sm text-gray-500 col-span-full">
              No users found for this search.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Games</h2>
            <p className="text-sm text-gray-400">
              Create games and assign platforms.
            </p>
          </div>
          {selectedGameIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={bulkDeletingGames}
              onClick={async () => {
                if (confirm(`Delete ${selectedGameIds.size} game(s)? This will also delete all related achievement sets and achievements.`)) {
                  await bulkDeleteGames({ variables: { ids: Array.from(selectedGameIds) } });
                }
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete {selectedGameIds.size} selected
            </Button>
          )}
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

        {games.length > 0 && (
          <div className="flex items-center gap-3 pb-2 border-b border-[#3D3D3D]">
            <input
              type="checkbox"
              checked={selectedGameIds.size === games.length && games.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedGameIds(new Set(games.map((g: any) => g.id)));
                } else {
                  setSelectedGameIds(new Set());
                }
              }}
              className="w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
            />
            <span className="text-sm text-gray-400">Select all ({games.length})</span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game: any) => (
            <div
              key={game.id}
              className={`border rounded-lg p-4 space-y-3 transition-colors ${
                selectedGameIds.has(game.id)
                  ? 'border-[#E60012] bg-[#E60012]/5'
                  : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3D3D3D]'
              }`}
            >
              {editingGameId === game.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                    value={editingGameTitle}
                    onChange={(event) => setEditingGameTitle(event.target.value)}
                  />
                  <textarea
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                    rows={2}
                    value={editingGameDescription}
                    onChange={(event) =>
                      setEditingGameDescription(event.target.value)
                    }
                  />
                  <input
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                    value={editingGameCoverUrl}
                    onChange={(event) =>
                      setEditingGameCoverUrl(event.target.value)
                    }
                  />
                  <select
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white focus:border-[#E60012] focus:outline-none"
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
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedGameIds.has(game.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedGameIds);
                        if (e.target.checked) {
                          newSet.add(game.id);
                        } else {
                          newSet.delete(game.id);
                        }
                        setSelectedGameIds(newSet);
                      }}
                      className="mt-1 w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {game.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {game.platform?.name || "No platform"}
                      </p>
                    </div>
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

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Game Versions</h2>
            <p className="text-sm text-gray-400">
              Create different editions of games (Standard, Deluxe, GOTY, etc.)
            </p>
          </div>
          {selectedVersionIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={bulkDeletingVersions}
              onClick={async () => {
                if (confirm(`Delete ${selectedVersionIds.size} version(s)?`)) {
                  await bulkDeleteVersions({ variables: { ids: Array.from(selectedVersionIds) } });
                }
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete {selectedVersionIds.size} selected
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            value={selectedVersionGameId}
            onChange={(event) => {
              setSelectedVersionGameId(event.target.value);
              setSelectedVersionIds(new Set());
            }}
          >
            <option value="">Select a game to manage versions</option>
            {games.map((game: any) => (
              <option key={game.id} value={game.id}>
                {game.title} {game.platform ? `(${game.platform.name})` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedVersionGameId && (
          <>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!newVersionName || !newVersionSlug) return;
                await createVersion({
                  variables: {
                    input: {
                      gameId: selectedVersionGameId,
                      name: newVersionName,
                      slug: newVersionSlug,
                      description: newVersionDescription || null,
                      coverUrl: newVersionCoverUrl || null,
                      includedDlc: newVersionDlc ? newVersionDlc.split(",").map(d => d.trim()) : [],
                    },
                  },
                });
                setNewVersionName("");
                setNewVersionSlug("");
                setNewVersionDescription("");
                setNewVersionCoverUrl("");
                setNewVersionDlc("");
              }}
              className="grid gap-4 md:grid-cols-2"
            >
              <input
                className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
                placeholder="Version name (e.g., Deluxe Edition)"
                value={newVersionName}
                onChange={(event) => setNewVersionName(event.target.value)}
              />
              <input
                className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
                placeholder="Slug (e.g., deluxe)"
                value={newVersionSlug}
                onChange={(event) => setNewVersionSlug(event.target.value)}
              />
              <input
                className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm md:col-span-2"
                placeholder="Description (optional)"
                value={newVersionDescription}
                onChange={(event) => setNewVersionDescription(event.target.value)}
              />
              <input
                className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
                placeholder="Cover URL (optional)"
                value={newVersionCoverUrl}
                onChange={(event) => setNewVersionCoverUrl(event.target.value)}
              />
              <input
                className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
                placeholder="Included DLC (comma separated)"
                value={newVersionDlc}
                onChange={(event) => setNewVersionDlc(event.target.value)}
              />
              <Button type="submit" loading={creatingVersion}>
                Add Version
              </Button>
            </form>

            {versionsLoading && <LoadingSpinner text="Loading versions..." />}

            {!versionsLoading && versions.length > 0 && (
              <div className="flex items-center gap-3 pb-2 border-b border-[#3D3D3D]">
                <input
                  type="checkbox"
                  checked={selectedVersionIds.size === versions.filter((v: any) => !v.isDefault).length && versions.filter((v: any) => !v.isDefault).length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedVersionIds(new Set(versions.filter((v: any) => !v.isDefault).map((v: any) => v.id)));
                    } else {
                      setSelectedVersionIds(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
                />
                <span className="text-sm text-gray-400">Select all non-default ({versions.filter((v: any) => !v.isDefault).length})</span>
              </div>
            )}

            {!versionsLoading && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {versions.map((version: any) => (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 space-y-3 transition-colors ${
                      selectedVersionIds.has(version.id)
                        ? 'border-[#E60012] bg-[#E60012]/5'
                        : version.isDefault
                        ? 'border-yellow-500/50 bg-yellow-500/5'
                        : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3D3D3D]'
                    }`}
                  >
                    {editingVersionId === version.id ? (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                          value={editingVersionName}
                          onChange={(event) => setEditingVersionName(event.target.value)}
                        />
                        <input
                          className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                          value={editingVersionSlug}
                          onChange={(event) => setEditingVersionSlug(event.target.value)}
                        />
                        <textarea
                          className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                          rows={2}
                          value={editingVersionDescription}
                          onChange={(event) => setEditingVersionDescription(event.target.value)}
                        />
                        <input
                          className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                          placeholder="Cover URL"
                          value={editingVersionCoverUrl}
                          onChange={(event) => setEditingVersionCoverUrl(event.target.value)}
                        />
                        <input
                          className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                          placeholder="Included DLC (comma separated)"
                          value={editingVersionDlc}
                          onChange={(event) => setEditingVersionDlc(event.target.value)}
                        />
                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={async () => {
                              await updateVersion({
                                variables: {
                                  id: version.id,
                                  input: {
                                    name: editingVersionName,
                                    slug: editingVersionSlug,
                                    description: editingVersionDescription || null,
                                    coverUrl: editingVersionCoverUrl || null,
                                    includedDlc: editingVersionDlc ? editingVersionDlc.split(",").map(d => d.trim()) : [],
                                  },
                                },
                              });
                              setEditingVersionId(null);
                            }}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingVersionId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          {!version.isDefault && (
                            <input
                              type="checkbox"
                              checked={selectedVersionIds.has(version.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedVersionIds);
                                if (e.target.checked) {
                                  newSet.add(version.id);
                                } else {
                                  newSet.delete(version.id);
                                }
                                setSelectedVersionIds(newSet);
                              }}
                              className="mt-1 w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-white">
                                {version.name}
                              </h3>
                              {version.isDefault && (
                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{version.slug}</p>
                            {version.description && (
                              <p className="text-xs text-gray-500 mt-1">{version.description}</p>
                            )}
                            {version.includedDlc?.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                DLC: {version.includedDlc.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditingVersionId(version.id);
                              setEditingVersionName(version.name);
                              setEditingVersionSlug(version.slug);
                              setEditingVersionDescription(version.description || "");
                              setEditingVersionCoverUrl(version.coverUrl || "");
                              setEditingVersionDlc(version.includedDlc?.join(", ") || "");
                            }}
                          >
                            Edit
                          </Button>
                          {!version.isDefault && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={async () => {
                                  await setDefaultVersion({ variables: { id: version.id } });
                                }}
                              >
                                Set Default
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  if (confirm("Delete this version?")) {
                                    await deleteVersion({ variables: { id: version.id } });
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {versions.length === 0 && (
                  <p className="text-sm text-gray-400 col-span-full">
                    No versions for this game yet.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Achievement Sets</h2>
            <p className="text-sm text-gray-400">
              Create and manage official, completionist, and custom sets.
            </p>
          </div>
          {selectedSetIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={bulkDeletingSets}
              onClick={async () => {
                if (confirm(`Delete ${selectedSetIds.size} achievement set(s)? This will also delete all achievements in these sets.`)) {
                  await bulkDeleteSets({ variables: { ids: Array.from(selectedSetIds) } });
                }
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete {selectedSetIds.size} selected
            </Button>
          )}
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
                  gameVersionId: newSetVersionId || null,
                },
              },
            });
            setNewSetTitle("");
            setNewSetGameId("");
            setNewSetVersionId("");
            setNewSetType("OFFICIAL");
          }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
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
            onChange={(event) => {
              setNewSetGameId(event.target.value);
              setNewSetVersionId("");
            }}
          >
            <option value="">Select game</option>
            {games.map((game: any) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm"
            value={newSetVersionId}
            onChange={(event) => setNewSetVersionId(event.target.value)}
            disabled={!newSetGameId || setGameVersions.length <= 1}
          >
            <option value="">All versions</option>
            {setGameVersions.map((version: any) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
          <Button type="submit" loading={creatingSet}>
            Add Set
          </Button>
        </form>

        {sets.length > 0 && (
          <div className="flex items-center gap-3 pb-2 border-b border-[#3D3D3D]">
            <input
              type="checkbox"
              checked={selectedSetIds.size === sets.length && sets.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSetIds(new Set(sets.map((s: any) => s.id)));
                } else {
                  setSelectedSetIds(new Set());
                }
              }}
              className="w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
            />
            <span className="text-sm text-gray-400">Select all ({sets.length})</span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sets.map((set: any) => (
            <div
              key={set.id}
              className={`border rounded-lg p-4 space-y-3 transition-colors ${
                selectedSetIds.has(set.id)
                  ? 'border-[#E60012] bg-[#E60012]/5'
                  : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3D3D3D]'
              }`}
            >
              {editingSetId === set.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                    value={editingSetTitle}
                    onChange={(event) => setEditingSetTitle(event.target.value)}
                  />
                  <select
                    className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white focus:border-[#E60012] focus:outline-none"
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
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSetIds.has(set.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedSetIds);
                        if (e.target.checked) {
                          newSet.add(set.id);
                        } else {
                          newSet.delete(set.id);
                        }
                        setSelectedSetIds(newSet);
                      }}
                      className="mt-1 w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {set.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {set.type} · {set.visibility.toLowerCase()} · {set.game.title}
                      </p>
                    </div>
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

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Achievements</h2>
            <p className="text-sm text-gray-400">
              Manage achievements within a set.
            </p>
          </div>
          {selectedAchievementIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={bulkDeletingAchievements}
              onClick={async () => {
                if (confirm(`Delete ${selectedAchievementIds.size} achievement(s)?`)) {
                  await bulkDeleteAchievements({ variables: { ids: Array.from(selectedAchievementIds) } });
                }
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete {selectedAchievementIds.size} selected
            </Button>
          )}
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
          <div className="border border-dashed border-[#3D3D3D] rounded-lg p-4 bg-[#0E0E0E]/50 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-white">Bulk Import (CSV)</h3>
              <p className="text-xs text-gray-500">
                Columns: title, description, points, iconUrl
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <select
                className="rounded-lg bg-[#1A1A1A] border border-[#3D3D3D] px-3 py-2 text-sm text-white focus:border-[#E60012] focus:outline-none"
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
          <>
            {achievements.length > 0 && (
              <div className="flex items-center gap-3 pb-2 border-b border-[#3D3D3D]">
                <input
                  type="checkbox"
                  checked={selectedAchievementIds.size === achievements.length && achievements.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAchievementIds(new Set(achievements.map((a: any) => a.id)));
                    } else {
                      setSelectedAchievementIds(new Set());
                    }
                  }}
                  className="w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
                />
                <span className="text-sm text-gray-400">Select all ({achievements.length})</span>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement: any) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-4 space-y-3 transition-colors ${
                    selectedAchievementIds.has(achievement.id)
                      ? 'border-[#E60012] bg-[#E60012]/5'
                      : 'border-[#2A2A2A] bg-[#1A1A1A] hover:border-[#3D3D3D]'
                  }`}
                >
                  {editingAchievementId === achievement.id ? (
                  <div className="space-y-2">
                    <input
                      className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                      value={editingAchievementTitle}
                      onChange={(event) =>
                        setEditingAchievementTitle(event.target.value)
                      }
                    />
                    <textarea
                      className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                      rows={2}
                      value={editingAchievementDescription}
                      onChange={(event) =>
                        setEditingAchievementDescription(event.target.value)
                      }
                    />
                    <input
                      className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
                      value={editingAchievementPoints}
                      onChange={(event) =>
                        setEditingAchievementPoints(event.target.value)
                      }
                      type="number"
                      min="0"
                    />
                    <input
                      className="w-full rounded-lg bg-[#0E0E0E] border border-[#3D3D3D] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#E60012] focus:outline-none"
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
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAchievementIds.has(achievement.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedAchievementIds);
                          if (e.target.checked) {
                            newSet.add(achievement.id);
                          } else {
                            newSet.delete(achievement.id);
                          }
                          setSelectedAchievementIds(newSet);
                        }}
                        className="mt-1 w-4 h-4 rounded border-[#3D3D3D] bg-[#0E0E0E]"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {achievement.points} points
                        </p>
                      </div>
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
          </>
        )}
      </section>
    </div>
  );
}
