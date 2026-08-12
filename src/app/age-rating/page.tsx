import { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Age Suitability - Trophy Rooms",
  description:
    "How Trophy Rooms is rated, what it shows, and why a 4+ app can catalog games of every rating.",
};

export default function AgeSuitability() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Age Suitability</h1>
        <p className={styles.lastUpdated}>Last Updated: August 12, 2026</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Rating</h2>
          <p className={styles.paragraph}>
            Trophy Rooms is rated <strong>4+</strong>. The app contains no violence, no
            profanity, no sexual content, no gambling, no alcohol, tobacco or drug
            references, and no horror or fear themes of its own.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>What Trophy Rooms Is</h2>
          <p className={styles.paragraph}>
            Trophy Rooms is a catalog and tracker for video game collections. You record
            which games you own, which you are playing, the condition of your physical
            copies, and how long you played. Nothing in the app is playable, and no game
            content is streamed, emulated, or reproduced.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>About the Game Catalog</h2>
          <p className={styles.paragraph}>
            The app searches a reference catalog of more than 47,000 published video
            games. That catalog spans every age rating, so it includes titles rated
            Mature by the ESRB or PEGI 18 alongside titles rated Everyone.
          </p>
          <p className={styles.paragraph}>
            For each game the app may display factual reference data:
          </p>
          <ul className={styles.list}>
            <li>Title, platform, release date, and edition</li>
            <li>Publisher-issued cover art</li>
            <li>A short factual description of the game</li>
            <li>The game&apos;s own content rating, where available</li>
          </ul>
          <p className={styles.paragraph}>
            This is the same kind of catalog information found in a retail listing or an
            encyclopedia entry. Cover art is publisher marketing artwork, already approved
            for public retail display. The app does not show gameplay footage, screenshots
            of mature scenes, or any interactive content from the games it lists.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Social Features</h2>
          <p className={styles.paragraph}>
            Trophy Rooms has a deliberately narrow social surface. Leaderboards and an
            activity feed show other users&apos; display names alongside the games they have
            completed. A user may also share a read-only link to their own buylist.
          </p>
          <p className={styles.paragraph}>
            There is <strong>no chat, no direct messaging, no comments, no forums, and no
            ability to upload images</strong>. Users cannot send content to one another.
            Free-text notes on a play session are private to the account that wrote them.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Commerce and Advertising</h2>
          <p className={styles.paragraph}>
            The app is free. There are no in-app purchases, no subscriptions, no
            advertising, and no third-party advertising or analytics SDKs. The
            &ldquo;buylist&rdquo; and &ldquo;sell list&rdquo; features are personal planning
            tools — they are lists a user keeps for themselves, and no transactions of any
            kind take place in the app.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Accounts</h2>
          <p className={styles.paragraph}>
            An account is required, because everything the app displays is the
            user&apos;s own data. Accounts can be created with Sign in with Apple, Google, or
            an email address and password. An account and all of its data can be
            permanently deleted from inside the app at any time, under Account &rarr; Delete
            Account.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Questions</h2>
          <p className={styles.paragraph}>
            Contact us at{" "}
            <a href="mailto:support@trophyrooms.org" className={styles.link}>
              support@trophyrooms.org
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
