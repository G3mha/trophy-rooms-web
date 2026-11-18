"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { SHOWCASE_LISTS, type Profile } from "@/lib/profile";
import { AppImage } from "./AppImage";
import styles from "./ProfileShowcases.module.css";

// The lists a user pinned to their profile, one cabinet shelf each. An empty
// list isn't shown.
export function ProfileShowcases({ profile }: { profile: Profile }) {
  const lists = SHOWCASE_LISTS.filter(({ key }) => (profile[key]?.length ?? 0) > 0);
  if (lists.length === 0) return null;

  return (
    <div className={styles.cabinet}>
      {lists.map(({ key, title }) => (
        <section key={key} className={styles.shelf} aria-labelledby={`showcase-${key}`}>
          <h2 id={`showcase-${key}`} className={styles.plaque}>
            {title}
          </h2>
          <div className={styles.scroller}>
            <ol className={styles.row}>
              {profile[key]!.map((game, index) => (
                <li key={game.id} className={styles.item}>
                  <Link href={`/games/title/${game.slug}`} className={styles.card}>
                    <span className={styles.cover}>
                      <AppImage
                        src={game.coverUrl}
                        alt=""
                        loading="lazy"
                        fallback={<Gamepad2 size={28} aria-hidden />}
                      />
                    </span>
                    <span className={styles.caption}>
                      <span className={styles.rank}>{index + 1}</span>
                      <span className={styles.gameTitle}>{game.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
