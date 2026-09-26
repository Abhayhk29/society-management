"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import {
  dashboardLinksForRole,
  filterNavLinks,
  primaryRole,
} from "@/lib/roles";
import styles from "./app-shell.module.css";

type AppShellProps = {
  children: ReactNode;
  subtitle?: string;
};

export function AppShell({ children, subtitle }: AppShellProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const role = primaryRole(user);
  const links = filterNavLinks(dashboardLinksForRole(role), user);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <Link href="/dashboard" className={styles.brand}>
            Nivas
          </Link>
          <p className={styles.muted}>
            {subtitle ??
              (user
                ? `${user.firstName} ${user.lastName} · ${role}`
                : "Signed-in workspace")}
          </p>
        </div>
        <div className={styles.actions}>
          {pathname !== "/dashboard" ? (
            <Link className={styles.linkBtn} href="/dashboard">
              Dashboard
            </Link>
          ) : null}
          <button
            type="button"
            className={styles.logout}
            onClick={() => {
              void logout().then(() => router.replace("/login"));
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {links.length > 0 ? (
        <nav className={styles.nav} aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={pathname === link.href ? "true" : "false"}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className={styles.main}>{children}</div>
    </div>
  );
}
