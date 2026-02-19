"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/graphql/queries";
import styles from "./Header.module.css";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
];

export function Header() {
  const pathname = usePathname();
  const { data } = useQuery(GET_ME);
  const role = data?.me?.role;
  const isAdmin = role === "ADMIN" || role === "TRUSTED";

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏆</span>
          <span className={styles.logoText}>Trophy Rooms</span>
        </Link>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${
                pathname === link.href ? styles.navLinkActive : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
          <SignedIn>
            <Link
              href="/dashboard"
              prefetch={false}
              className={`${styles.navLink} ${
                pathname === "/dashboard" ? styles.navLinkActive : ""
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/trophy-room"
              prefetch={false}
              className={`${styles.navLink} ${styles.trophyRoomLink} ${
                pathname === "/trophy-room" ? styles.navLinkActive : ""
              }`}
            >
              <span className={styles.trophyIcon}>🏆</span> My Trophy Room
            </Link>
          </SignedIn>
          {isAdmin && (
            <Link
              href="/admin"
              className={`${styles.navLink} ${
                pathname === "/admin" ? styles.navLinkActive : ""
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className={styles.actions}>
          <SignedOut>
            <Link href="/sign-in" className={styles.signInBtn}>
              Sign In
            </Link>
            <Link href="/sign-up" className={styles.signUpBtn}>
              Sign Up
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: styles.avatarBox,
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
