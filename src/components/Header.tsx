"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useQuery } from "@apollo/client";
import { GET_ME } from "@/graphql/queries";
import styles from "./Header.module.css";

const navLinks = [
  { href: "/games", label: "Games" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/activity", label: "Activity" },
];

const myStuffLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/trophy-room", label: "My Trophy Room", icon: "🏆" },
  { href: "/library", label: "My Library", icon: "📚" },
  { href: "/collection", label: "My Collection", icon: "📀" },
];

export function Header() {
  const pathname = usePathname();
  const { data } = useQuery(GET_ME);
  const role = data?.me?.role;
  const isAdmin = role === "ADMIN" || role === "TRUSTED";

  const isMyStuffActive = myStuffLinks.some((link) => pathname === link.href);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/logo.png"
            alt="Trophy Rooms"
            width={180}
            height={40}
            className={styles.logoImage}
            priority
          />
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
            <div className={styles.dropdown}>
              <button
                className={`${styles.navLink} ${styles.dropdownTrigger} ${
                  isMyStuffActive ? styles.navLinkActive : ""
                }`}
              >
                My Stuff
                <svg
                  className={styles.dropdownArrow}
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className={styles.dropdownMenu}>
                {myStuffLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    className={`${styles.dropdownItem} ${
                      pathname === link.href ? styles.dropdownItemActive : ""
                    }`}
                  >
                    <span className={styles.dropdownIcon}>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
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
