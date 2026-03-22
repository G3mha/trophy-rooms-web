"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_USERS_ADMIN } from "@/graphql/admin_queries";
import { SET_USER_ROLE } from "@/graphql/admin_mutations";
import { LoadingSpinner } from "@/components";
import styles from "../page.module.css";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [userSearch, setUserSearch] = useState("");

  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useQuery(GET_USERS_ADMIN, {
    variables: { first: 100, search: userSearch || undefined },
  });

  const [setUserRole, { loading: updatingRole }] = useMutation(SET_USER_ROLE, {
    onCompleted: () => refetchUsers(),
  });

  const users = usersData?.users?.edges?.map((e: { node: User }) => e.node) || [];

  if (usersLoading && users.length === 0) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div>
          <h1 className={styles.pageTitle}>Users & Roles</h1>
          <p className={styles.sectionSubtitle}>Manage user roles and permissions.</p>
        </div>
      </div>

      <div style={{ maxWidth: 400, marginBottom: 20 }}>
        <input
          className={styles.input}
          placeholder="Search by name or email"
          value={userSearch}
          onChange={(event) => setUserSearch(event.target.value)}
        />
      </div>

      <div className={styles.itemsGrid}>
        {users.map((user: User) => (
          <div key={user.id} className={styles.itemCard}>
            <div className={styles.itemInfo} style={{ flex: 1 }}>
              <div>
                <span className={styles.itemName}>
                  {user.name || "Unnamed User"}
                </span>
                <span className={styles.itemMeta} style={{ display: "block", marginTop: 2 }}>
                  {user.email}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <select
                className={styles.input}
                style={{ width: 120, padding: "6px 10px" }}
                value={user.role}
                onChange={(event) =>
                  setUserRole({
                    variables: { userId: user.id, role: event.target.value },
                  })
                }
                disabled={updatingRole}
              >
                <option value="USER">User</option>
                <option value="TRUSTED">Trusted</option>
                <option value="ADMIN">Admin</option>
              </select>
              <span className={styles.itemMeta}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <p className={styles.itemMeta}>No users found.</p>
        )}
      </div>
    </div>
  );
}
