"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { GET_ME } from "@/graphql/queries";
import { LoadingSpinner, EmptyState, Button } from "@/components";
import {
  Gamepad,
  Layers,
  Star,
  Trophy,
  Users,
  Puzzle,
  Package,
  LayoutDashboard,
  Lock,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import styles from "./layout.module.css";

const adminLinks = [
  {
    section: "Content Management",
    links: [
      { href: "/admin/platforms", label: "Platforms", icon: Gamepad },
      { href: "/admin/games", label: "Games", icon: Layers },
      { href: "/admin/game-versions", label: "Game Versions", icon: Layers },
      { href: "/admin/achievement-sets", label: "Achievement Sets", icon: Trophy },
      { href: "/admin/achievements", label: "Achievements", icon: Star },
      { href: "/admin/dlcs", label: "DLCs & Expansions", icon: Puzzle },
      { href: "/admin/bundles", label: "Bundles", icon: Package },
    ],
  },
  {
    section: "User Management",
    links: [
      { href: "/admin/users", label: "Users & Roles", icon: Users },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: meData, loading: meLoading } = useQuery(GET_ME, {
    skip: !isSignedIn,
  });

  const isAdmin =
    meData?.me?.role === "ADMIN" || meData?.me?.role === "TRUSTED";

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  if (!isLoaded || meLoading) {
    return <LoadingSpinner text="Checking access..." />;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (!isAdmin) {
    return (
      <div className={styles.accessDenied}>
        <EmptyState
          icon={<Lock size={48} />}
          title="Admin Access Required"
          description="You don't have permission to access the admin dashboard."
          action={<Button href="/">Back Home</Button>}
        />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <Link href="/admin" className={styles.mobileTitle}>
          <LayoutDashboard size={20} />
          <span>Admin Dashboard</span>
        </Link>
        <button
          className={styles.menuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <Link href="/admin" className={styles.sidebarHeader}>
          <LayoutDashboard size={20} />
          <span>Admin Dashboard</span>
        </Link>

        <nav className={styles.nav}>
          {adminLinks.map((group) => (
            <div key={group.section} className={styles.navGroup}>
              <h3 className={styles.navGroupTitle}>{group.section}</h3>
              <ul className={styles.navList}>
                {group.links.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                      >
                        <Icon size={16} />
                        <span>{link.label}</span>
                        <ChevronRight size={14} className={styles.navArrow} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
