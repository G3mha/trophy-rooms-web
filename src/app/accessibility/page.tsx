import { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Accessibility - Trophy Rooms",
  description:
    "What Trophy Rooms supports for VoiceOver, Voice Control, Reduce Motion, contrast and text size, what it does not yet, and how to report a problem.",
};

export default function Accessibility() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Accessibility</h1>
        <p className={styles.lastUpdated}>Last Updated: August 20, 2026</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Our Approach</h2>
          <p className={styles.paragraph}>
            Trophy Rooms is built with SwiftUI and uses the system&apos;s own
            accessibility features rather than working around them. This page lists what
            the app supports today and, just as importantly, what it does not yet. We
            would rather name a gap than claim support we have not verified.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Supported</h2>

          <p className={styles.paragraph}>
            <strong>VoiceOver.</strong> Every control is reachable and named. Game
            covers announce the game&apos;s title along with its status, region and
            condition, so the browsing grid is usable without seeing the artwork.
            Controls that toggle something report whether they are on. Progress bars
            announce their percentage. Decorative artwork is hidden from VoiceOver
            rather than read out as noise.
          </p>

          <p className={styles.paragraph}>
            <strong>Voice Control.</strong> Because every control carries a name, the
            same labels VoiceOver reads can be spoken to activate them.
          </p>

          <p className={styles.paragraph}>
            <strong>Reduce Motion.</strong> When the setting is on, animated
            transitions are replaced by an instant change of state. Nothing slides,
            pulses or repeats. The change still happens; only the frames in between are
            dropped.
          </p>

          <p className={styles.paragraph}>
            <strong>Dark Interface.</strong> The app is dark by design, so it does not
            depend on a bright display to be readable.
          </p>

          <p className={styles.paragraph}>
            <strong>Sufficient Contrast.</strong> Text colours are measured against the
            surfaces they sit on and meet the WCAG AA ratio of 4.5:1. Where a colour in
            our palette fell short, the text is lightened until it passes, while the
            surrounding fill keeps the original colour.
          </p>

          <p className={styles.paragraph}>
            <strong>Differentiate Without Color Alone.</strong> Status, condition and
            ownership are never signalled by colour on its own. Each carries a distinct
            icon and a text label as well.
          </p>

          <p className={styles.paragraph}>
            <strong>Larger Text.</strong> Text scales with the Dynamic Type setting,
            including the small labels on game covers, and layouts are built to hold at
            the largest accessibility sizes. Rows of tags wrap onto another line rather
            than running off the edge, and tags are never abbreviated part-way — a
            half-read label is worse than a wrapped one.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Known Gaps</h2>
          <p className={styles.paragraph}>
            <strong>Labels on cover art.</strong> The small badges drawn over a game&apos;s
            cover — status, region, condition — scale with your text size but stop at a
            ceiling, because the artwork underneath is a fixed size and they would
            otherwise cover it. Everything they show is also on the game&apos;s own screen
            at full size, and VoiceOver reads all of it aloud.
          </p>
          <p className={styles.paragraph}>
            <strong>Captions and Audio Descriptions.</strong> Not applicable. Trophy
            Rooms contains no video or audio content.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Reporting a Problem</h2>
          <p className={styles.paragraph}>
            If something in Trophy Rooms is difficult or impossible to use, we want to
            hear about it. Email us at{" "}
            <a href="mailto:support@trophyrooms.org" className={styles.link}>
              support@trophyrooms.org
            </a>
            . It helps if you can include:
          </p>
          <ul className={styles.list}>
            <li>Which screen or control the problem is on</li>
            <li>Which accessibility features you have turned on</li>
            <li>Your device and iOS version</li>
          </ul>
          <p className={styles.paragraph}>
            Accessibility reports are treated as bugs, not feature requests.
          </p>
        </section>
      </div>
    </div>
  );
}
