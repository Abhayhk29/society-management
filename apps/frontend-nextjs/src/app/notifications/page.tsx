"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/auth-context";
import {
  AppNotification,
  NotificationPreferences,
  getNotificationPreferences,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from "@/lib/api";
import styles from "../gate-passes/gate-passes.module.css";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3003";

export default function NotificationsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canView = Boolean(user?.permissions?.includes("view:notification"));

  async function refresh() {
    if (!token) return;
    const [list, count, preferences] = await Promise.all([
      listNotifications(token),
      getUnreadCount(token),
      getNotificationPreferences(token),
    ]);
    setItems(list);
    setUnread(count.count);
    setPrefs(preferences);
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !canView) return;
    void refresh().catch((e) =>
      setError(e instanceof Error ? e.message : "Load failed"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canView]);

  useEffect(() => {
    if (!token || !user || !canView) return;
    let socket: Socket | null = null;
    try {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
      });
      socket.on("notification.created", () => {
        void refresh();
      });
    } catch {
      // Socket optional for inbox
    }
    return () => {
      socket?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.uid, canView]);

  if (loading || !user) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Loading…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>Missing view:notification permission.</p>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>
            Notifications {unread > 0 ? `(${unread} unread)` : ""}
          </p>
        </div>
        <Link className={styles.linkBtn} href="/dashboard">
          Dashboard
        </Link>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.actions} style={{ marginBottom: "0.75rem" }}>
            <button
              type="button"
              onClick={() =>
                void markAllNotificationsRead(token!).then(async () => {
                  setMessage("All marked read");
                  await refresh();
                })
              }
            >
              Mark all read
            </button>
          </div>
          <ul className={styles.list}>
            {items.map((n) => (
              <li key={n.uid}>
                <button
                  type="button"
                  onClick={() =>
                    void markNotificationRead(n.uid, token!).then(async () => {
                      await refresh();
                    })
                  }
                >
                  <strong>
                    {n.status === "READ" ? "" : "● "}
                    {n.title}
                  </strong>
                  <span>
                    {n.type} · {n.sourceService} · {n.body}
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 ? (
              <li className={styles.muted}>No notifications yet.</li>
            ) : null}
          </ul>
        </section>

        {prefs ? (
          <section className={styles.card}>
            <h2>Channel preferences</h2>
            <p className={styles.muted}>
              Email / SMS / push use console adapters in v1 (logged by
              service-core). In-app inbox is always persisted.
            </p>
            {(
              [
                ["emailEnabled", "Email"],
                ["smsEnabled", "SMS"],
                ["pushEnabled", "Push"],
                ["inAppEnabled", "In-app"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={Boolean(prefs[key])}
                  onChange={(e) => {
                    const next = { ...prefs, [key]: e.target.checked };
                    setPrefs(next);
                    void updateNotificationPreferences(
                      { [key]: e.target.checked },
                      token!,
                    ).then((p) => {
                      setPrefs(p);
                      setMessage("Preferences saved");
                    });
                  }}
                />
                {label}
              </label>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
