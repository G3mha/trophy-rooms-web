"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { SHOWCASE_LISTS, type Profile } from "@/lib/profile";
import { AppImage } from "./AppImage";
import styles from "./ProfileShowcases.module.css";

// The lists a user pinned to their profile. An empty list isn't shown.
export function ProfileShowcases({ profile }: { profile: Profile }) {
  const lists = SHOWCASE_LISTS.filter(({ key }) => (profile[key]?.length ?? 0) > 0);
  if (lists.length === 0) return null;

  return (
    <div className={styles.showcases}>
      {lists.map(({ key, title }) => (
        <section key={key} className={styles.section} aria-labelledby={`showcase-${key}`}>
          <h2 id={`showcase-${key}`} className={styles.title}>
            {title}
          </h2>
          <ol className={styles.grid}>
            {profile[key]!.map((game, index) => (
              <li key={game.id}>
                <Link href={`/games/title/${game.slug}`} className={styles.card}>
                  <span className={styles.cover}>
                    <AppImage
                      src={game.coverUrl}
                      alt=""
                      loading="lazy"
                      fallback={<Gamepad2 size={28} aria-hidden />}
                    />
                    <span className={styles.rank} aria-hidden>
                      {index + 1}
                    </span>
                  </span>
                  <span className={styles.gameTitle}>{game.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
