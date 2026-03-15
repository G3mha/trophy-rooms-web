import { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy - Trophy Rooms",
  description: "Learn how Trophy Rooms collects, uses, and protects your personal information.",
};

export default function PrivacyPolicy() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.lastUpdated}>Last Updated: March 15, 2026</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Introduction</h2>
          <p className={styles.paragraph}>
            Welcome to Trophy Rooms. We are committed to protecting your personal information
            and your right to privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our service.
          </p>
          <p className={styles.paragraph}>
            Please read this Privacy Policy carefully. By using Trophy Rooms, you agree to the
            collection and use of information in accordance with this policy.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
          <p className={styles.paragraph}>
            We collect information that you provide directly to us, as well as information
            collected automatically when you use our service.
          </p>
          <p className={styles.paragraph}>
            <strong>Information you provide:</strong>
          </p>
          <ul className={styles.list}>
            <li>Account information (email address, username, profile picture)</li>
            <li>Gaming data (games you track, achievements you mark as completed)</li>
            <li>Communications with us (support requests, feedback)</li>
          </ul>
          <p className={styles.paragraph}>
            <strong>Information collected automatically:</strong>
          </p>
          <ul className={styles.list}>
            <li>Usage data (pages visited, features used, timestamps)</li>
            <li>Device information (browser type, operating system)</li>
            <li>Log data (IP address, access times)</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
          <p className={styles.paragraph}>
            We use the information we collect to:
          </p>
          <ul className={styles.list}>
            <li>Provide, maintain, and improve our services</li>
            <li>Create and manage your account</li>
            <li>Track your gaming achievements and progress</li>
            <li>Generate leaderboards and activity feeds</li>
            <li>Respond to your comments, questions, and support requests</li>
            <li>Send you technical notices and updates</li>
            <li>Protect against fraudulent or unauthorized activity</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Third-Party Services</h2>
          <p className={styles.paragraph}>
            Trophy Rooms integrates with the following third-party services:
          </p>
          <p className={styles.paragraph}>
            <strong>Clerk (Authentication):</strong> We use Clerk for user authentication.
            When you sign up or sign in, Clerk processes your authentication data according
            to their privacy policy. Visit{" "}
            <a
              href="https://clerk.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              clerk.com/privacy
            </a>{" "}
            for more information.
          </p>
          <p className={styles.paragraph}>
            <strong>Google OAuth:</strong> If you choose to sign in with Google, we receive
            limited profile information from Google (name, email, profile picture). We do not
            have access to your Google password or other Google account data.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Data Security</h2>
          <p className={styles.paragraph}>
            We implement appropriate technical and organizational security measures to protect
            your personal information against unauthorized access, alteration, disclosure, or
            destruction. However, no method of transmission over the Internet is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Data Retention</h2>
          <p className={styles.paragraph}>
            We retain your personal information for as long as your account is active or as
            needed to provide you services. You may request deletion of your account and
            associated data at any time by contacting us.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Your Rights</h2>
          <p className={styles.paragraph}>
            Depending on your location, you may have the following rights regarding your
            personal information:
          </p>
          <ul className={styles.list}>
            <li>Access and receive a copy of your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request deletion of your personal data</li>
            <li>Object to or restrict processing of your personal data</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className={styles.paragraph}>
            To exercise any of these rights, please contact us using the information below.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Changes to This Policy</h2>
          <p className={styles.paragraph}>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page and updating the
            &quot;Last Updated&quot; date.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Contact Us</h2>
          <p className={styles.paragraph}>
            If you have any questions about this Privacy Policy, please contact us at:{" "}
            <a href="mailto:privacy@trophyrooms.app" className={styles.link}>
              privacy@trophyrooms.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
