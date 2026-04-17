"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import {
  GET_PLATFORMS,
  GET_GAMES_ADMIN,
  GET_ACHIEVEMENT_SETS_ADMIN,
  GET_USERS_ADMIN,
  GET_BUNDLES,
} from "@/graphql/admin_queries";
import {
  ArrowRight,
  Gamepad,
  Layers,
  Trophy,
  Star,
  Users,
  Puzzle,
  Package,
  ChevronRight,
} from "lucide-react";
import styles from "./page.module.css";

interface StatCardProps {
  eyebrow: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  loading?: boolean;
}

function StatCard({ eyebrow, title, count, icon, href, loading }: StatCardProps) {
  return (
    <Link href={href} className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
        <span className={styles.statEyebrow}>{eyebrow}</span>
        <span className={styles.statCount}>
          {loading ? "..." : count.toLocaleString()}
        </span>
        <span className={styles.statTitle}>{title}</span>
      </div>
      <ChevronRight size={16} className={styles.statArrow} />
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data: platformsData, loading: platformsLoading } = useQuery(GET_PLATFORMS);
  const { data: gamesData, loading: gamesLoading } = useQuery(GET_GAMES_ADMIN, {
    variables: { first: 1 },
  });
  const { data: setsData, loading: setsLoading } = useQuery(GET_ACHIEVEMENT_SETS_ADMIN);
  const { data: usersData, loading: usersLoading } = useQuery(GET_USERS_ADMIN, {
    variables: { first: 1 },
  });
  const { data: bundlesData, loading: bundlesLoading } = useQuery(GET_BUNDLES);

  const platformCount = platformsData?.platforms?.length || 0;
  const gameCount = gamesData?.games?.totalCount || 0;
  const setCount = setsData?.achievementSets?.length || 0;
  const userCount = usersData?.users?.totalCount || 0;
  const bundleCount = bundlesData?.bundles?.length || 0;
  const totalManagedRecords =
    platformCount + gameCount + setCount + userCount + bundleCount;

  const statCards = [
    {
      eyebrow: "Catalog",
      title: "Platforms",
      count: platformCount,
      icon: <Gamepad size={24} />,
      href: "/admin/platforms",
      loading: platformsLoading,
    },
    {
      eyebrow: "Catalog",
      title: "Games",
      count: gameCount,
      icon: <Layers size={24} />,
      href: "/admin/games",
      loading: gamesLoading,
    },
    {
      eyebrow: "Progress",
      title: "Achievement Sets",
      count: setCount,
      icon: <Trophy size={24} />,
      href: "/admin/achievement-sets",
      loading: setsLoading,
    },
    {
      eyebrow: "Accounts",
      title: "Users",
      count: userCount,
      icon: <Users size={24} />,
      href: "/admin/users",
      loading: usersLoading,
    },
    {
      eyebrow: "Storefront",
      title: "Bundles",
      count: bundleCount,
      icon: <Package size={24} />,
      href: "/admin/bundles",
      loading: bundlesLoading,
    },
  ] satisfies StatCardProps[];

  const quickActions = [
    {
      title: "Manage Platforms",
      description: "Update console branding, promo art, and regional release dates.",
      href: "/admin/platforms",
      icon: <Gamepad size={20} />,
    },
    {
      title: "Manage Games",
      description: "Create game records, group variants, and maintain platform coverage.",
      href: "/admin/games",
      icon: <Layers size={20} />,
    },
    {
      title: "Game Versions",
      description: "Link deluxe editions and defaults across multiple game records.",
      href: "/admin/game-versions",
      icon: <Layers size={20} />,
    },
    {
      title: "Achievement Sets",
      description: "Organize official, custom, and completionist progression tracks.",
      href: "/admin/achievement-sets",
      icon: <Trophy size={20} />,
    },
    {
      title: "Achievements",
      description: "Edit individual tasks, imports, and point values inside each set.",
      href: "/admin/achievements",
      icon: <Star size={20} />,
    },
    {
      title: "DLCs & Expansions",
      description: "Attach post-launch content to the correct game families and platforms.",
      href: "/admin/dlcs",
      icon: <Puzzle size={20} />,
    },
    {
      title: "Bundles",
      description: "Curate packages, collections, and season-pass style products.",
      href: "/admin/bundles",
      icon: <Package size={20} />,
    },
    {
      title: "Users & Roles",
      description: "Review accounts and promote trusted or admin access when needed.",
      href: "/admin/users",
      icon: <Users size={20} />,
    },
  ];

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.sectionSubtitle}>
            Manage platforms, games, achievements, and users.
          </p>
        </div>
      </div>

      <div className={styles.dashboardHero}>
        <section className={styles.dashboardLead}>
          <h2 className={styles.dashboardLeadTitle}>Admin Control Center</h2>
          <p className={styles.dashboardLeadText}>
            Keep the catalog, storefront, and progression systems aligned from one place. Start with the area that changed most recently, then use the quick actions below to move directly into the relevant workflow.
          </p>
          <div className={styles.dashboardPills}>
            <span className={styles.dashboardPill}>
              <Gamepad size={14} />
              Catalog
            </span>
            <span className={styles.dashboardPill}>
              <Trophy size={14} />
              Progression
            </span>
            <span className={styles.dashboardPill}>
              <Package size={14} />
              Storefront
            </span>
            <span className={styles.dashboardPill}>
              <Users size={14} />
              Permissions
            </span>
          </div>
        </section>

        <aside className={styles.dashboardSidecard}>
          <p className={styles.dashboardSidecardLabel}>Managed Records</p>
          <p className={styles.dashboardSidecardValue}>
            {totalManagedRecords.toLocaleString()}
          </p>
          <p className={styles.dashboardSidecardText}>
            Snapshot across the core admin entities surfaced on this dashboard.
          </p>
          <div className={styles.dashboardMiniStats}>
            <div className={styles.dashboardMiniStat}>
              <span className={styles.dashboardMiniStatValue}>{platformCount}</span>
              <span className={styles.dashboardMiniStatLabel}>Platforms</span>
            </div>
            <div className={styles.dashboardMiniStat}>
              <span className={styles.dashboardMiniStatValue}>{gameCount}</span>
              <span className={styles.dashboardMiniStatLabel}>Games</span>
            </div>
            <div className={styles.dashboardMiniStat}>
              <span className={styles.dashboardMiniStatValue}>{setCount}</span>
              <span className={styles.dashboardMiniStatLabel}>Sets</span>
            </div>
            <div className={styles.dashboardMiniStat}>
              <span className={styles.dashboardMiniStatValue}>{bundleCount}</span>
              <span className={styles.dashboardMiniStatLabel}>Bundles</span>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className={styles.quickLinks}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickLinksGrid}>
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href} className={styles.quickLink}>
              <span className={styles.quickLinkIcon}>{action.icon}</span>
              <span className={styles.quickLinkBody}>
                <span className={styles.quickLinkTitle}>{action.title}</span>
                <span className={styles.quickLinkDescription}>
                  {action.description}
                </span>
              </span>
              <ArrowRight size={16} className={styles.quickLinkArrow} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
