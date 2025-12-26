"use client";

import { useQuery } from "@apollo/client";
import { GET_GAMES } from "@/graphql/queries";
import Link from "next/link";

export default function Home() {
  const { data, loading, error } = useQuery(GET_GAMES, {
    variables: { first: 10 },
  });

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Trophy Rooms
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Track your Nintendo Switch achievements
        </p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Games</h2>

          {loading && <p>Loading games...</p>}

          {error && (
            <p className="text-red-500">
              Error loading games: {error.message}
            </p>
          )}

          {data?.games?.edges && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.games.edges.map(({ node: game }: { node: { id: string; title: string; description?: string; achievementCount: number; trophyCount: number } }) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="block p-4 border rounded-lg hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-semibold">{game.title}</h3>
                  {game.description && (
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {game.description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{game.achievementCount} achievements</span>
                    <span>{game.trophyCount} trophies</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {data?.games?.totalCount === 0 && (
            <p className="text-gray-500">No games yet. Add your first game!</p>
          )}
        </div>
      </div>
    </main>
  );
}
