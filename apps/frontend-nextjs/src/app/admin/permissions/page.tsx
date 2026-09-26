"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import {
  ManagedPermission,
  createPermission,
  deletePermission,
  listPermissions,
  updatePermission,
} from "@/lib/api";
import { hasPermission } from "@/lib/roles";
import styles from "../admin.module.css";

export default function AdminPermissionsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<ManagedPermission[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [action, setAction] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [description, setDescription] = useState("");
  const [editAction, setEditAction] = useState("");
  const [editModule, setEditModule] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const canManage = hasPermission(user, "manage:permissions");

  const reload = useCallback(async () => {
    if (!token || !canManage) return;
    setRows(await listPermissions(token));
  }, [token, canManage]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !canManage) return;
    void reload().catch((err) =>
      setError(
        err instanceof Error ? err.message : "Failed to load permissions",
      ),
    );
  }, [token, canManage, reload]);

  useEffect(() => {
    const selected = rows.find((r) => r.uid === selectedId);
    if (!selected) return;
    setEditAction(selected.action);
    setEditModule(selected.module);
    setEditDescription(selected.description ?? "");
  }, [selectedId, rows]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.action.toLowerCase().includes(q) ||
        r.module.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [rows, filter]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!token || !canManage) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const created = await createPermission(
        {
          action,
          module: moduleName,
          description: description || undefined,
        },
        token,
      );
      setMessage(`Created ${created.action}`);
      setAction("");
      setModuleName("");
      setDescription("");
      await reload();
      setSelectedId(created.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedId || !canManage) return;
    setPending(true);
    setError("");
    try {
      await updatePermission(
        selectedId,
        {
          action: editAction,
          module: editModule,
          description: editDescription || null,
        },
        token,
      );
      setMessage("Permission updated");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!token || !selectedId || !canManage) return;
    if (!window.confirm("Delete this permission?")) return;
    setPending(true);
    setError("");
    try {
      await deletePermission(selectedId, token);
      setMessage("Permission deleted");
      setSelectedId("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (!canManage) {
    return (
      <AppShell subtitle="Admin · Permissions">
        <div className={styles.denied}>
          <h1>Permissions</h1>
          <p className={styles.error}>Missing manage:permissions permission.</p>
          <Link href="/dashboard">Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="Admin · Permissions">
      <div className={styles.heading}>
        <h1>Permissions</h1>
        <p>Catalog of actions used by gateway guards (e.g. view:user).</p>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.message}>{message}</p> : null}

      <div className={styles.layout}>
        <section className={styles.panel}>
          <form className={styles.form} onSubmit={onCreate}>
            <h2>New permission</h2>
            <label>
              Action
              <input
                required
                maxLength={100}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="create:something"
              />
            </label>
            <label>
              Module
              <input
                required
                maxLength={50}
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="users"
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <button type="submit" disabled={pending}>
              Create permission
            </button>
          </form>

          <label className={styles.field}>
            Filter
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search action or module"
            />
          </label>

          <h2>Catalog ({filtered.length})</h2>
          <ul className={styles.list}>
            {filtered.map((row) => (
              <li
                key={row.uid}
                className={styles.listItem}
                data-active={row.uid === selectedId ? "true" : "false"}
              >
                <button
                  type="button"
                  className={styles.selectBtn}
                  onClick={() => setSelectedId(row.uid)}
                >
                  <span className={styles.name}>{row.action}</span>
                  <span className={styles.sub}>
                    {row.module}
                    {row.description ? ` · ${row.description}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2>Selected permission</h2>
          {!selectedId ? (
            <p className={styles.empty}>Select a permission to edit.</p>
          ) : (
            <form className={styles.form} onSubmit={onSave}>
              <label>
                Action
                <input
                  required
                  value={editAction}
                  onChange={(e) => setEditAction(e.target.value)}
                />
              </label>
              <label>
                Module
                <input
                  required
                  value={editModule}
                  onChange={(e) => setEditModule(e.target.value)}
                />
              </label>
              <label>
                Description
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </label>
              <div className={styles.rowActions}>
                <button type="submit" disabled={pending}>
                  Save
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={pending}
                  onClick={() => void onDelete()}
                >
                  Delete
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </AppShell>
  );
}
