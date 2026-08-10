"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "@apollo/client";
import { ChevronDown, LayoutDashboard, Trophy, Library, Disc, ShoppingCart, Shield, CalendarClock, LogOut } from "lucide-react";
import { GET_ME } from "@/graphql/queries";
import { useAuth } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import styles from "./Header.module.css";

const navLinks = [
  { href: "/games", label: "Games" },
  { href: "/bundles", label: "Bundles" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/activity", label: "Activity" },
];

const myStuffLinks = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/trophy-room", label: "My Trophy Room", Icon: Trophy },
  { href: "/library", label: "My Library", Icon: Library },
  { href: "/journal", label: "Play Journal", Icon: CalendarClock },
  { href: "/buylist", label: "My Buylist", Icon: ShoppingCart },
  { href: "/collection", label: "My Collection", Icon: Disc },
];

function UserMenu() {
  const { user } = useAuth();

  const metadata = user?.user_metadata ?? {};
  const avatarUrl = metadata.avatar_url ?? metadata.picture;
  const displayName = metadata.full_name ?? metadata.name ?? user?.email ?? "";
  const initial = displayName.charAt(0).toUpperCase() || "?";

  const handleSignOut = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    // Full reload so the Apollo cache drops the signed-in user's data
    window.location.assign("/");
  };

  return (
    <div className={styles.dropdown}>
      <button type="button" className={styles.avatarButton} aria-label="Account">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarFallback}>{initial}</span>
        )}
      </button>
      <div className={`${styles.dropdownMenu} ${styles.userMenuDropdown}`}>
        <p className={styles.userEmail}>{user?.email}</p>
        <button
          type="button"
          className={`${styles.dropdownItem} ${styles.signOutItem}`}
          onClick={handleSignOut}
        >
          <LogOut className={styles.dropdownIcon} size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { data } = useQuery(GET_ME, { skip: !isSignedIn });
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
          {isSignedIn && (
            <div className={styles.dropdown}>
              <button
                className={`${styles.navLink} ${styles.dropdownTrigger} ${
                  isMyStuffActive ? styles.navLinkActive : ""
                }`}
              >
                My Stuff
                <ChevronDown className={styles.dropdownArrow} size={14} />
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
                    <link.Icon className={styles.dropdownIcon} size={16} />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
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
          {isLoaded && !isSignedIn && (
            <>
              <Link href="/sign-in" className={styles.signInBtn}>
                Sign In
              </Link>
              <Link href="/sign-up" className={styles.signUpBtn}>
                Sign Up
              </Link>
            </>
          )}
          {isSignedIn && (
            <div className={styles.userSection}>
              {isAdmin && (
                <span className={styles.adminBadge} title="Admin">
                  <Shield size={14} />
                </span>
              )}
              <UserMenu />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
