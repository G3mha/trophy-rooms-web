"use client";

import { useQuery, useMutation } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { GET_MY_WISHLIST } from "@/graphql/queries";
import { REMOVE_FROM_WISHLIST } from "@/graphql/mutations";
import { LoadingSpinner, EmptyState, Button } from "@/components";
import styles from "./page.module.css";

interface WishlistItem {
  id: string;
  gameId: string;
  gameTitle: string;
  gameCoverUrl: string | null;
  gameDescription: string | null;
  achievementCount: number;
  addedAt: string;
}

export default function WishlistPage() {
  const { isSignedIn, isLoaded } = useAuth();

  const { data, loading, refetch } = useQuery(GET_MY_WISHLIST, {
    skip: !isSignedIn,
  });

  const [removeFromWishlist, { loading: removing }] = useMutation(
    REMOVE_FROM_WISHLIST,
    {
      onCompleted: () => refetch(),
    }
  );

  if (!isLoaded) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <LoadingSpinner text="Loading your wishlist..." />
      </div>
    );
  }

  const wishlist: WishlistItem[] = data?.myWishlist || [];

  const handleRemove = async (gameId: string) => {
    await removeFromWishlist({ variables: { gameId } });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Wishlist</h1>
        <p className={styles.subtitle}>
          Games you want to play and complete
        </p>
      </header>

      {wishlist.length > 0 ? (
        <div className={styles.wishlistGrid}>
          {wishlist.map((item) => (
            <div key={item.id} className={styles.wishlistCard}>
              <Link href={`/games/${item.gameId}`} className={styles.gameLink}>
                <div className={styles.coverContainer}>
                  {item.gameCoverUrl ? (
                    <img
                      src={item.gameCoverUrl}
                      alt={item.gameTitle}
                      className={styles.cover}
                    />
                  ) : (
                    <div className={styles.coverPlaceholder}>
                      <span>🎮</span>
                    </div>
                  )}
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.gameTitle}>{item.gameTitle}</h3>
                  {item.gameDescription && (
                    <p className={styles.gameDescription}>
                      {item.gameDescription}
                    </p>
                  )}
                  <div className={styles.gameMeta}>
                    <span className={styles.achievementCount}>
                      {item.achievementCount} achievements
                    </span>
                    <span className={styles.addedDate}>
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
              <button
                className={styles.removeButton}
                onClick={() => handleRemove(item.gameId)}
                disabled={removing}
                title="Remove from wishlist"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="💖"
          title="Your wishlist is empty"
          description="Browse games and add them to your wishlist to keep track of games you want to play."
          action={<Button href="/games">Browse Games</Button>}
        />
      )}
    </div>
  );
}
