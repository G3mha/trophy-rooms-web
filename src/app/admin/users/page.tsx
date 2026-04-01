"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS_ADMIN } from "@/graphql/admin_queries";
import { SET_USER_ROLE } from "@/graphql/admin_mutations";
import { LoadingSpinner, Pagination } from "@/components";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import styles from "../page.module.css";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  USER: "User",
  TRUSTED: "Trusted",
  ADMIN: "Admin",
};

const DEFAULT_PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination state
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Map<number, string | null>>(
    new Map([[1, null]])
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userSearch);
      // Reset pagination when search changes
      setCurrentPage(1);
      setCursors(new Map([[1, null]]));
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(GET_USERS_ADMIN, {
    variables: {
      first: pageSize,
      after: cursors.get(currentPage) || null,
      search: debouncedSearch || undefined,
    },
  });

  const [setUserRole, { loading: updatingRole }] = useMutation(SET_USER_ROLE, {
    onCompleted: () => refetchUsers(),
  });

  const users =
    usersData?.users?.edges?.map((e: { node: User }) => e.node) || [];
  const pageInfo: PageInfo = usersData?.users?.pageInfo || {
    hasNextPage: false,
    endCursor: null,
  };
  const totalCount = usersData?.users?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;

      if (page === currentPage + 1 && pageInfo.endCursor) {
        setCursors((prev) => new Map(prev).set(page, pageInfo.endCursor));
      }

      if (page === 1) {
        setCursors(new Map([[1, null]]));
      }

      setCurrentPage(page);
    },
    [currentPage, pageInfo.endCursor, totalPages]
  );

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setCursors(new Map([[1, null]]));
  }, []);

  const handleRoleChange = (userId: string, role: string | null) => {
    if (role) {
      setUserRole({
        variables: { userId, role },
      });
    }
  };

  if (usersLoading && users.length === 0) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users & Roles</h1>
          <p className={styles.sectionSubtitle}>
            Manage user roles and permissions.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
          />
        </div>
      </div>

      {/* Users List */}
      <div className={styles.itemsGrid}>
        {users.map((user: User) => (
          <div key={user.id} className={styles.itemCard}>
            <div className={styles.itemInfo} style={{ flex: 1 }}>
              <div>
                <span className={styles.itemName}>
                  {user.name || "Unnamed User"}
                </span>
                <span
                  className={styles.itemSlug}
                  style={{ display: "block", marginTop: 2 }}
                >
                  {user.email}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 120 }}>
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={updatingRole}
                >
                  <SelectTrigger>
                    <span>{ROLE_LABELS[user.role] || user.role}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="TRUSTED">Trusted</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className={styles.itemMeta}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className={styles.emptyState}>
            {userSearch
              ? `No users found matching "${userSearch}"`
              : "No users found."}
          </p>
        )}
      </div>

      {totalCount > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          loading={usersLoading}
        />
      )}
    </div>
  );
}
