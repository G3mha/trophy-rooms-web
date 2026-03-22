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
import { LoadingSpinner } from "@/components";
import {
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
  title: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  loading?: boolean;
}

function StatCard({ title, count, icon, href, loading }: StatCardProps) {
  return (
    <Link href={href} className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
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

      <div className={styles.statsGrid}>
        <StatCard
          title="Platforms"
          count={platformCount}
          icon={<Gamepad size={24} />}
          href="/admin/platforms"
          loading={platformsLoading}
        />
        <StatCard
          title="Games"
          count={gameCount}
          icon={<Layers size={24} />}
          href="/admin/games"
          loading={gamesLoading}
        />
        <StatCard
          title="Achievement Sets"
          count={setCount}
          icon={<Trophy size={24} />}
          href="/admin/achievement-sets"
          loading={setsLoading}
        />
        <StatCard
          title="Users"
          count={userCount}
          icon={<Users size={24} />}
          href="/admin/users"
          loading={usersLoading}
        />
        <StatCard
          title="Bundles"
          count={bundleCount}
          icon={<Package size={24} />}
          href="/admin/bundles"
          loading={bundlesLoading}
        />
      </div>

      <div className={styles.quickLinks}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickLinksGrid}>
          <Link href="/admin/platforms" className={styles.quickLink}>
            <Gamepad size={20} />
            <span>Manage Platforms</span>
          </Link>
          <Link href="/admin/games" className={styles.quickLink}>
            <Layers size={20} />
            <span>Manage Games</span>
          </Link>
          <Link href="/admin/game-versions" className={styles.quickLink}>
            <Layers size={20} />
            <span>Game Versions</span>
          </Link>
          <Link href="/admin/achievement-sets" className={styles.quickLink}>
            <Trophy size={20} />
            <span>Achievement Sets</span>
          </Link>
          <Link href="/admin/achievements" className={styles.quickLink}>
            <Star size={20} />
            <span>Achievements</span>
          </Link>
          <Link href="/admin/dlcs" className={styles.quickLink}>
            <Puzzle size={20} />
            <span>DLCs & Expansions</span>
          </Link>
          <Link href="/admin/bundles" className={styles.quickLink}>
            <Package size={20} />
            <span>Bundles</span>
          </Link>
          <Link href="/admin/users" className={styles.quickLink}>
            <Users size={20} />
            <span>Users & Roles</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
