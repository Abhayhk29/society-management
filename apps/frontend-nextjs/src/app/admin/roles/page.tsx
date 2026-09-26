"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import {
  ManagedPermission,
  ManagedRole,
  assignRolePermission,
  createRole,
  deleteRole,
  listPermissions,
  listRolePermissions,
  listRoles,
  removeRolePermission,
  updateRole,
} from "@/lib/api";
import { hasPermission } from "@/lib/roles";
import styles from "../admin.module.css";

export default function AdminRolesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [catalog, setCatalog] = useState<ManagedPermission[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [assigned, setAssigned] = useState<ManagedPermission[]>([]);
  const [permToAssign, setPermToAssign] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const canManage = hasPermission(user, "manage:roles");
  const canManagePerms = hasPermission(user, "manage:permissions");

  const reload = useCallback(async () => {
    if (!token || !canManage) return;
    setRoles(await listRoles(token));
  }, [token, canManage]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !canManage) return;
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load roles"),
    );
  }, [token, canManage, reload]);

  useEffect(() => {
    if (!token || !canManagePerms) return;
    void listPermissions(token)
      .then(setCatalog)
      .catch(() => setCatalog([]));
  }, [token, canManagePerms]);

  useEffect(() => {
    if (!token || !selectedId || !canManage) {
      setAssigned([]);
      return;
    }
    const role = roles.find((r) => r.uid === selectedId);
    if (role) {
      setEditName(role.name);
      setEditDescription(role.description ?? "");
    }
    void listRolePermissions(selectedId, token)
      .then((items) =>
        setAssigned(items.map((i) => i.permission).filter(Boolean)),
      )
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load role permissions",
        ),
      );
  }, [token, selectedId, canManage, roles]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!token || !canManage) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const created = await createRole(
        { name, description: description || undefined },
        token,
      );
      setMessage(`Created role ${created.name}`);
      setName("");
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
      await updateRole(
        selectedId,
        {
          name: editName,
          description: editDescription || null,
        },
        token,
      );
      setMessage("Role updated");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!token || !selectedId || !canManage) return;
    if (!window.confirm("Delete this role?")) return;
    setPending(true);
    setError("");
    try {
      await deleteRole(selectedId, token);
      setMessage("Role deleted");
      setSelectedId("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  async function onAssignPerm(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedId || !permToAssign || !canManage) return;
    setPending(true);
    setError("");
    try {
      await assignRolePermission(selectedId, permToAssign, token);
      setMessage("Permission assigned");
      setPermToAssign("");
      const items = await listRolePermissions(selectedId, token);
      setAssigned(items.map((i) => i.permission).filter(Boolean));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setPending(false);
    }
  }

  async function onRemovePerm(permissionId: string) {
    if (!token || !selectedId || !canManage) return;
    setPending(true);
    setError("");
    try {
      await removeRolePermission(selectedId, permissionId, token);
      setMessage("Permission removed");
      const items = await listRolePermissions(selectedId, token);
      setAssigned(items.map((i) => i.permission).filter(Boolean));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (!canManage) {
    return (
      <AppShell subtitle="Admin · Roles">
        <div className={styles.denied}>
          <h1>Roles</h1>
          <p className={styles.error}>Missing manage:roles permission.</p>
          <Link href="/dashboard">Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const availablePerms = catalog.filter(
    (p) => !assigned.some((a) => a.uid === p.uid),
  );

  return (
    <AppShell subtitle="Admin · Roles">
      <div className={styles.heading}>
        <h1>Roles</h1>
        <p>Define roles and attach permissions from the catalog.</p>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.message}>{message}</p> : null}

      <div className={styles.layout}>
        <section className={styles.panel}>
          <form className={styles.form} onSubmit={onCreate}>
            <h2>New role</h2>
            <label>
              Name
              <input
                required
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder="e.g. COMMITTEE"
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
              Create role
            </button>
          </form>

          <h2>All roles</h2>
          <ul className={styles.list}>
            {roles.map((role) => (
              <li
                key={role.uid}
                className={styles.listItem}
                data-active={role.uid === selectedId ? "true" : "false"}
              >
                <button
                  type="button"
                  className={styles.selectBtn}
                  onClick={() => setSelectedId(role.uid)}
                >
                  <span className={styles.name}>{role.name}</span>
                  <span className={styles.sub}>
                    {role.description || "No description"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.panel}>
          <h2>Selected role</h2>
          {!selectedId ? (
            <p className={styles.empty}>Select a role to edit.</p>
          ) : (
            <>
              <form className={styles.form} onSubmit={onSave}>
                <label>
                  Name
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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

              <h2>Permissions</h2>
              <div className={styles.chips}>
                {assigned.length === 0 ? (
                  <span className={styles.empty}>None assigned</span>
                ) : (
                  assigned.map((p) => (
                    <span key={p.uid} className={styles.chip}>
                      {p.action}
                      <button
                        type="button"
                        aria-label={`Remove ${p.action}`}
                        onClick={() => void onRemovePerm(p.uid)}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              {canManagePerms && availablePerms.length > 0 ? (
                <form className={styles.inline} onSubmit={onAssignPerm}>
                  <label className={styles.field}>
                    Add permission
                    <select
                      value={permToAssign}
                      onChange={(e) => setPermToAssign(e.target.value)}
                      required
                    >
                      <option value="">Select…</option>
                      {availablePerms.map((p) => (
                        <option key={p.uid} value={p.uid}>
                          {p.action} ({p.module})
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" disabled={pending || !permToAssign}>
                    Assign
                  </button>
                </form>
              ) : (
                <p className={styles.empty}>
                  {canManagePerms
                    ? "All catalog permissions are assigned."
                    : "Need manage:permissions to browse the catalog for assignment."}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
