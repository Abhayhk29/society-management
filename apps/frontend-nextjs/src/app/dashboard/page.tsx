"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading your workspace…</p>
      </div>
    );
  }

  const roles =
    user.roles?.map((role) => role.name).filter(Boolean).join(", ") ||
    "No roles assigned";
  const permissions =
    user.permissions?.length ? user.permissions.join(", ") : "None loaded";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>Signed in workspace</p>
        </div>
        <button
          type="button"
          className={styles.logout}
          onClick={() => {
            void logout().then(() => router.replace("/login"));
          }}
        >
          Sign out
        </button>
      </header>

      <section className={styles.panel}>
        <h1>
          Welcome, {user.firstName} {user.lastName}
        </h1>
        <dl className={styles.meta}>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Roles</dt>
            <dd>{roles}</dd>
          </div>
          <div>
            <dt>Permissions</dt>
            <dd>{permissions}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{user.isActive ? "Active" : "Inactive"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
