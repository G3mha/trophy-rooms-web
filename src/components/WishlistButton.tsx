"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "@clerk/nextjs";
import { TOGGLE_WISHLIST } from "@/graphql/mutations";
import { IS_GAME_IN_WISHLIST, GET_MY_WISHLIST } from "@/graphql/queries";
import styles from "./WishlistButton.module.css";

interface WishlistButtonProps {
  gameId: string;
  variant?: "default" | "compact" | "icon-only";
  className?: string;
}

export function WishlistButton({
  gameId,
  variant = "default",
  className = "",
}: WishlistButtonProps) {
  const { isSignedIn } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data, loading: queryLoading } = useQuery(IS_GAME_IN_WISHLIST, {
    variables: { gameId },
    skip: !isSignedIn,
  });

  const [toggleWishlist, { loading: mutationLoading }] = useMutation(
    TOGGLE_WISHLIST,
    {
      variables: { gameId },
      refetchQueries: [
        { query: IS_GAME_IN_WISHLIST, variables: { gameId } },
        { query: GET_MY_WISHLIST },
      ],
      onCompleted: (data) => {
        if (data.toggleWishlist.success) {
          setIsInWishlist(data.toggleWishlist.wishlistId !== null);
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 300);
        }
      },
    }
  );

  useEffect(() => {
    if (data?.isGameInWishlist !== undefined) {
      setIsInWishlist(data.isGameInWishlist);
    }
  }, [data]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSignedIn || mutationLoading) return;
    await toggleWishlist();
  };

  if (!isSignedIn) {
    return null;
  }

  const loading = queryLoading || mutationLoading;

  const buttonClasses = [
    styles.button,
    styles[variant],
    isInWishlist ? styles.active : "",
    isAnimating ? styles.animating : "",
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={loading}
      title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
      aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <span className={styles.icon}>{isInWishlist ? "❤️" : "🤍"}</span>
      {variant !== "icon-only" && (
        <span className={styles.label}>
          {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
        </span>
      )}
    </button>
  );
}
