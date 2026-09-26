"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import {
  dashboardLinksForRole,
  filterNavLinks,
  primaryRole,
  roleHeadline,
} from "@/lib/roles";
import styles from "./dashboard.module.css";

const TILE_HINTS: Record<string, string> = {
  "/admin/users": "Create accounts and assign roles",
  "/admin/roles": "Define what each role can do",
  "/admin/permissions": "Catalog of access actions",
  "/gate-passes": "Create, approve, or scan visitor passes",
  "/billing": "Bills, payments, and receipts",
  "/community": "Notices, complaints, and visitors",
  "/vendors": "Onboard and review service vendors",
  "/work-orders": "Track maintenance jobs",
  "/insights": "Society health and AI summaries",
  "/notifications": "Inbox and channel preferences",
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const role = primaryRole(user);
  const headline = roleHeadline(role);
  const tiles = useMemo(
    () => filterNavLinks(dashboardLinksForRole(role), user),
    [role, user],
  );

  if (loading || !user) {
    return (
      <div className={styles.loading}>
        <p>Loading your workspace…</p>
      </div>
    );
  }

  const roleNames =
    user.roles?.map((r) => r.name).filter(Boolean).join(", ") ||
    "No roles assigned";

  return (
    <AppShell>
      <section className={styles.hero}>
        <p className={styles.rolePill}>{role}</p>
        <h1>
          {headline.title}, {user.firstName}
        </h1>
        <p className={styles.blurb}>{headline.blurb}</p>
      </section>

      <section className={styles.tiles} aria-label="Quick links">
        {tiles.map((link) => (
          <Link key={link.href} href={link.href} className={styles.tile}>
            <span className={styles.tileLabel}>{link.label}</span>
            <span className={styles.tileHint}>
              {TILE_HINTS[link.href] ?? "Open"}
            </span>
          </Link>
        ))}
      </section>

      <dl className={styles.meta}>
        <div>
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div>
          <dt>Roles</dt>
          <dd>{roleNames}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{user.isActive ? "Active" : "Inactive"}</dd>
        </div>
      </dl>
    </AppShell>
  );
}
