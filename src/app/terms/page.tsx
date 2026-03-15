import { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Terms of Service - Trophy Rooms",
  description: "Read the Terms of Service for using Trophy Rooms.",
};

export default function TermsOfService() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.lastUpdated}>Last Updated: March 15, 2026</p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
          <p className={styles.paragraph}>
            By accessing or using Trophy Rooms, you agree to be bound by these Terms of Service
            and all applicable laws and regulations. If you do not agree with any of these terms,
            you are prohibited from using or accessing this service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Description of Service</h2>
          <p className={styles.paragraph}>
            Trophy Rooms is a cross-platform achievement tracking service that allows users to:
          </p>
          <ul className={styles.list}>
            <li>Track video game achievements and trophies across multiple platforms</li>
            <li>Maintain a personal gaming library and collection</li>
            <li>Compare progress with other users via leaderboards</li>
            <li>Share gaming activity and accomplishments</li>
          </ul>
          <p className={styles.paragraph}>
            We reserve the right to modify, suspend, or discontinue any aspect of the service
            at any time without prior notice.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. User Accounts</h2>
          <p className={styles.paragraph}>
            To access certain features of Trophy Rooms, you must create an account. You are
            responsible for:
          </p>
          <ul className={styles.list}>
            <li>Providing accurate and complete registration information</li>
            <li>Maintaining the security of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use of your account</li>
          </ul>
          <p className={styles.paragraph}>
            We reserve the right to suspend or terminate accounts that violate these terms
            or engage in prohibited conduct.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. User Conduct</h2>
          <p className={styles.paragraph}>
            When using Trophy Rooms, you agree not to:
          </p>
          <ul className={styles.list}>
            <li>Violate any applicable laws or regulations</li>
            <li>Impersonate any person or entity</li>
            <li>Upload or transmit malicious code or harmful content</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the service or servers</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Use automated systems to access the service without permission</li>
            <li>Falsify achievement data or game progress</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Intellectual Property</h2>
          <p className={styles.paragraph}>
            The Trophy Rooms service, including its original content, features, and functionality,
            is owned by Trophy Rooms and is protected by international copyright, trademark, and
            other intellectual property laws.
          </p>
          <p className={styles.paragraph}>
            Game titles, logos, and achievement data displayed on Trophy Rooms are the property
            of their respective owners. Trophy Rooms does not claim ownership of third-party
            intellectual property.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. User Content</h2>
          <p className={styles.paragraph}>
            You retain ownership of any content you submit to Trophy Rooms. By submitting content,
            you grant us a non-exclusive, worldwide, royalty-free license to use, display, and
            distribute that content in connection with the service.
          </p>
          <p className={styles.paragraph}>
            You are solely responsible for the content you submit and must ensure it does not
            infringe on any third-party rights or violate any laws.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Disclaimers</h2>
          <p className={styles.paragraph}>
            Trophy Rooms is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, either express or implied, including but not limited to
            implied warranties of merchantability, fitness for a particular purpose, and
            non-infringement.
          </p>
          <p className={styles.paragraph}>
            We do not guarantee that the service will be uninterrupted, secure, or error-free,
            or that any defects will be corrected.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Limitation of Liability</h2>
          <p className={styles.paragraph}>
            To the maximum extent permitted by law, Trophy Rooms and its affiliates shall not
            be liable for any indirect, incidental, special, consequential, or punitive damages,
            including but not limited to loss of profits, data, use, or goodwill, arising out
            of or in connection with your use of the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Indemnification</h2>
          <p className={styles.paragraph}>
            You agree to indemnify and hold harmless Trophy Rooms and its officers, directors,
            employees, and agents from any claims, damages, losses, or expenses arising out of
            your use of the service or violation of these terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Changes to Terms</h2>
          <p className={styles.paragraph}>
            We reserve the right to modify these Terms of Service at any time. We will notify
            users of significant changes by posting a notice on the service or sending an email.
            Your continued use of the service after changes are posted constitutes acceptance
            of the modified terms.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Governing Law</h2>
          <p className={styles.paragraph}>
            These Terms of Service shall be governed by and construed in accordance with the
            laws of the jurisdiction in which Trophy Rooms operates, without regard to conflict
            of law principles.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>12. Contact Us</h2>
          <p className={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at:{" "}
            <a href="mailto:legal@trophyrooms.app" className={styles.link}>
              legal@trophyrooms.app
            </a>
          </p>
          <p className={styles.paragraph}>
            For privacy-related inquiries, please refer to our{" "}
            <Link href="/privacy" className={styles.link}>
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
