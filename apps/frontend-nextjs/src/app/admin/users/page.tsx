"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/context/auth-context";
import {
  ManagedRole,
  ManagedUser,
  assignUserRole,
  createUser,
  deleteUser,
  listRoles,
  listUserRoles,
  listUsers,
  removeUserRole,
  updateUser,
} from "@/lib/api";
import { hasPermission } from "@/lib/roles";
import styles from "../admin.module.css";

export default function AdminUsersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<ManagedRole[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [userRoles, setUserRoles] = useState<ManagedRole[]>([]);
  const [roleToAssign, setRoleToAssign] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const canView = hasPermission(user, "view:user");
  const canCreate = hasPermission(user, "create:user");
  const canUpdate = hasPermission(user, "update:user");
  const canDelete = hasPermission(user, "delete:user");
  const canManageRoles = hasPermission(user, "manage:roles");

  const reload = useCallback(async () => {
    if (!token || !canView) return;
    const rows = await listUsers(token);
    setUsers(rows);
  }, [token, canView]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !canView) return;
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load users"),
    );
  }, [token, canView, reload]);

  useEffect(() => {
    if (!token || !canManageRoles) return;
    void listRoles(token)
      .then(setRoles)
      .catch(() => {
        /* roles list optional if manage:roles missing on edge cases */
      });
  }, [token, canManageRoles]);

  useEffect(() => {
    if (!token || !selectedId || !canManageRoles) {
      setUserRoles([]);
      return;
    }
    void listUserRoles(selectedId, token)
      .then((items) => setUserRoles(items.map((i) => i.role).filter(Boolean)))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load roles"),
      );
  }, [token, selectedId, canManageRoles]);

  const selected = users.find((u) => u.uid === selectedId) ?? null;

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!token || !canCreate) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const created = await createUser(
        {
          email,
          password,
          firstName,
          lastName,
          phoneNumber: phoneNumber || undefined,
        },
        token,
      );
      setMessage(`Created ${created.email}`);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      await reload();
      setSelectedId(created.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function toggleActive() {
    if (!token || !selected || !canUpdate) return;
    setPending(true);
    setError("");
    try {
      await updateUser(selected.uid, { isActive: !selected.isActive }, token);
      setMessage(
        selected.isActive ? "User deactivated" : "User reactivated",
      );
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!token || !selected || !canDelete) return;
    if (!window.confirm(`Deactivate / remove ${selected.email}?`)) return;
    setPending(true);
    setError("");
    try {
      await deleteUser(selected.uid, token);
      setMessage("User removed");
      setSelectedId("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  async function onAssignRole(event: FormEvent) {
    event.preventDefault();
    if (!token || !selectedId || !roleToAssign || !canManageRoles) return;
    setPending(true);
    setError("");
    try {
      await assignUserRole(selectedId, roleToAssign, token);
      setMessage("Role assigned");
      const items = await listUserRoles(selectedId, token);
      setUserRoles(items.map((i) => i.role).filter(Boolean));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setPending(false);
    }
  }

  async function onRemoveRole(roleId: string) {
    if (!token || !selectedId || !canManageRoles) return;
    setPending(true);
    setError("");
    try {
      await removeUserRole(selectedId, roleId, token);
      setMessage("Role removed");
      const items = await listUserRoles(selectedId, token);
      setUserRoles(items.map((i) => i.role).filter(Boolean));
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setPending(false);
    }
  }

  if (loading || !user) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (!canView) {
    return (
      <AppShell subtitle="Admin · Users">
        <div className={styles.denied}>
          <h1>Users</h1>
          <p className={styles.error}>Missing view:user permission.</p>
          <Link href="/dashboard">Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  const assignable = roles.filter(
    (r) => !userRoles.some((ur) => ur.uid === r.uid),
  );

  return (
    <AppShell subtitle="Admin · Users">
      <div className={styles.heading}>
        <h1>Users</h1>
        <p>Create accounts, activate or deactivate members, and assign roles.</p>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.message}>{message}</p> : null}

      <div className={styles.layout}>
        <section className={styles.panel}>
          {canCreate ? (
            <form className={styles.form} onSubmit={onCreate}>
              <h2>New user</h2>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label>
                First name
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>
              <label>
                Last name
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>
              <label>
                Phone (optional)
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </label>
              <button type="submit" disabled={pending}>
                Create user
              </button>
            </form>
          ) : null}

          <h2>Directory</h2>
          {users.length === 0 ? (
            <p className={styles.empty}>No users yet.</p>
          ) : (
            <ul className={styles.list}>
              {users.map((row) => (
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
                    <span className={styles.name}>
                      {row.firstName} {row.lastName}
                    </span>
                    <span className={styles.sub}>
                      {row.email}
                      {" · "}
                      {row.isActive ? "Active" : "Inactive"}
                      {row.roles?.length
                        ? ` · ${row.roles.map((r) => r.name).join(", ")}`
                        : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <h2>Selected user</h2>
          {!selected ? (
            <p className={styles.empty}>Select a user to manage.</p>
          ) : (
            <>
              <div>
                <p className={styles.name}>
                  {selected.firstName} {selected.lastName}
                </p>
                <p className={styles.sub}>{selected.email}</p>
                <p className={styles.sub}>
                  {selected.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className={styles.rowActions}>
                {canUpdate ? (
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={pending}
                    onClick={() => void toggleActive()}
                  >
                    {selected.isActive ? "Deactivate" : "Activate"}
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    className={styles.danger}
                    disabled={pending}
                    onClick={() => void onDelete()}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              {canManageRoles ? (
                <>
                  <h2>Roles</h2>
                  <div className={styles.chips}>
                    {userRoles.length === 0 ? (
                      <span className={styles.empty}>No roles assigned</span>
                    ) : (
                      userRoles.map((r) => (
                        <span key={r.uid} className={styles.chip}>
                          {r.name}
                          <button
                            type="button"
                            aria-label={`Remove ${r.name}`}
                            onClick={() => void onRemoveRole(r.uid)}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <form className={styles.inline} onSubmit={onAssignRole}>
                    <label className={styles.field}>
                      Assign role
                      <select
                        value={roleToAssign}
                        onChange={(e) => setRoleToAssign(e.target.value)}
                        required
                      >
                        <option value="">Select…</option>
                        {assignable.map((r) => (
                          <option key={r.uid} value={r.uid}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button type="submit" disabled={pending || !roleToAssign}>
                      Assign
                    </button>
                  </form>
                </>
              ) : null}
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
