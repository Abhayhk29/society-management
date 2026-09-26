"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Society,
  Vendor,
  WorkOrder,
  WorkOrderEvent,
  WorkOrderQuote,
  assignWorkOrder,
  completeWorkOrder,
  createWorkOrder,
  decideQuote,
  listQuotes,
  listSocieties,
  listVendors,
  listWorkOrderEvents,
  listWorkOrders,
  proposeQuote,
  startWorkOrder,
  verifyWorkOrder,
} from "@/lib/api";
import styles from "../gate-passes/gate-passes.module.css";

export default function WorkOrdersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState("");
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [quotes, setQuotes] = useState<WorkOrderQuote[]>([]);
  const [events, setEvents] = useState<WorkOrderEvent[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("PLUMBING");
  const [assignVendorId, setAssignVendorId] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("500");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const canView = Boolean(user?.permissions?.includes("view:work_order"));
  const canCreate = Boolean(user?.permissions?.includes("create:work_order"));
  const canManage = Boolean(user?.permissions?.includes("manage:work_order"));
  const canUpdate = Boolean(user?.permissions?.includes("update:work_order"));

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !canView) return;
    void listSocieties(token).then((rows) => {
      setSocieties(rows.filter((s) => s.isActive));
      if (rows[0]) setSocietyId((p) => p || rows[0].uid);
    });
  }, [token, canView]);

  async function refresh(sid: string) {
    if (!token || !sid) return;
    const [o, v] = await Promise.all([
      listWorkOrders(sid, token),
      user?.permissions?.includes("view:vendor")
        ? listVendors(token, { societyId: sid, status: "APPROVED" }).catch(
            () => listVendors(token, { status: "APPROVED" }),
          )
        : Promise.resolve([]),
    ]);
    setOrders(o);
    setVendors(v);
    if (v[0] && !assignVendorId) setAssignVendorId(v[0].uid);
  }

  useEffect(() => {
    void refresh(societyId).catch((e) =>
      setError(e instanceof Error ? e.message : "Load failed"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societyId, token]);

  async function selectOrder(order: WorkOrder) {
    setSelected(order);
    if (!token) return;
    const [q, ev] = await Promise.all([
      listQuotes(order.uid, token),
      listWorkOrderEvents(order.uid, token),
    ]);
    setQuotes(q);
    setEvents(ev);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    setError("");
    try {
      await createWorkOrder(
        { societyId, title, description, category, priority: "NORMAL" },
        token,
      );
      setTitle("");
      setDescription("");
      setMessage("Work order created");
      await refresh(societyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

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
        <p className={styles.error}>Missing view:work_order permission.</p>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>Work orders</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.linkBtn} href="/vendors">
            Vendors
          </Link>
          <Link className={styles.linkBtn} href="/dashboard">
            Dashboard
          </Link>
        </div>
      </header>

      <div className={styles.toolbar}>
        <label>
          Society
          <select
            value={societyId}
            onChange={(e) => setSocietyId(e.target.value)}
          >
            {societies.map((s) => (
              <option key={s.uid} value={s.uid}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <div className={styles.grid}>
        {canCreate ? (
          <form className={styles.card} onSubmit={onCreate}>
            <h2>New work order</h2>
            <label>
              Title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="CIVIL">Civil</option>
                <option value="HOUSEKEEPING">Housekeeping</option>
                <option value="SECURITY">Security</option>
                <option value="GENERAL">General</option>
              </select>
            </label>
            <button type="submit" disabled={pending}>
              Create
            </button>
          </form>
        ) : null}

        <section className={styles.card}>
          <h2>Orders</h2>
          <ul className={styles.list}>
            {orders.map((o) => (
              <li key={o.uid}>
                <button type="button" onClick={() => void selectOrder(o)}>
                  <strong>{o.title}</strong>
                  <span>
                    {o.status} · {o.priority} · {o.category}
                  </span>
                </button>
              </li>
            ))}
            {orders.length === 0 ? (
              <li className={styles.muted}>No work orders.</li>
            ) : null}
          </ul>
        </section>

        {selected ? (
          <section className={styles.card}>
            <h2>{selected.title}</h2>
            <p className={styles.muted}>{selected.description}</p>
            <p>
              Status: <strong>{selected.status}</strong>
            </p>

            <div className={styles.actions}>
              {canManage &&
              ["OPEN", "QUOTED", "ASSIGNED", "ON_HOLD"].includes(
                selected.status,
              ) ? (
                <>
                  <select
                    value={assignVendorId}
                    onChange={(e) => setAssignVendorId(e.target.value)}
                  >
                    {vendors.map((v) => (
                      <option key={v.uid} value={v.uid}>
                        {v.displayName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void assignWorkOrder(
                        selected.uid,
                        assignVendorId,
                        token!,
                      ).then(async (o) => {
                        setSelected(o);
                        setMessage("Vendor assigned");
                        await refresh(societyId);
                        await selectOrder(o);
                      })
                    }
                  >
                    Assign vendor
                  </button>
                </>
              ) : null}

              {canUpdate &&
              (selected.status === "ASSIGNED" ||
                selected.status === "ON_HOLD") ? (
                <button
                  type="button"
                  onClick={() =>
                    void startWorkOrder(selected.uid, token!).then(async (o) => {
                      setSelected(o);
                      setMessage("Started");
                      await refresh(societyId);
                      await selectOrder(o);
                    })
                  }
                >
                  Start
                </button>
              ) : null}

              {canUpdate &&
              (selected.status === "IN_PROGRESS" ||
                selected.status === "ON_HOLD") ? (
                <button
                  type="button"
                  onClick={() =>
                    void completeWorkOrder(
                      selected.uid,
                      { resolutionNotes: "Done via Nivas UI" },
                      token!,
                    ).then(async (o) => {
                      setSelected(o);
                      setMessage("Completed");
                      await refresh(societyId);
                      await selectOrder(o);
                    })
                  }
                >
                  Complete
                </button>
              ) : null}

              {canManage && selected.status === "COMPLETED" ? (
                <button
                  type="button"
                  onClick={() =>
                    void verifyWorkOrder(selected.uid, token!).then(
                      async (o) => {
                        setSelected(o);
                        setMessage("Verified");
                        await refresh(societyId);
                        await selectOrder(o);
                      },
                    )
                  }
                >
                  Verify
                </button>
              ) : null}
            </div>

            {canUpdate &&
            (selected.status === "OPEN" || selected.status === "QUOTED") ? (
              <form
                style={{ marginTop: "1rem" }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void proposeQuote(
                    selected.uid,
                    {
                      vendorId: assignVendorId,
                      amount: Number(quoteAmount),
                    },
                    token!,
                  ).then(async () => {
                    setMessage("Quote proposed");
                    await refresh(societyId);
                    await selectOrder(selected);
                  });
                }}
              >
                <h3>Propose quote</h3>
                <label>
                  Vendor
                  <select
                    value={assignVendorId}
                    onChange={(e) => setAssignVendorId(e.target.value)}
                  >
                    {vendors.map((v) => (
                      <option key={v.uid} value={v.uid}>
                        {v.displayName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                  />
                </label>
                <button type="submit">Submit quote</button>
              </form>
            ) : null}

            <h3 style={{ marginTop: "1.25rem" }}>Quotes</h3>
            <ul className={styles.list}>
              {quotes.map((q) => (
                <li key={q.uid}>
                  <div>
                    <strong>
                      ₹{q.amount} · {q.status}
                    </strong>
                  </div>
                  {canManage && q.status === "PROPOSED" ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() =>
                          void decideQuote(q.uid, true, token!).then(
                            async () => {
                              setMessage("Quote accepted → assigned");
                              await refresh(societyId);
                              const updated = await listWorkOrders(
                                societyId,
                                token!,
                              );
                              const cur =
                                updated.find((o) => o.uid === selected.uid) ??
                                null;
                              if (cur) await selectOrder(cur);
                            },
                          )
                        }
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() =>
                          void decideQuote(q.uid, false, token!).then(
                            async () => {
                              await selectOrder(selected);
                            },
                          )
                        }
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
              {quotes.length === 0 ? (
                <li className={styles.muted}>No quotes.</li>
              ) : null}
            </ul>

            <h3 style={{ marginTop: "1.25rem" }}>Timeline</h3>
            <ul className={styles.list}>
              {events.map((ev) => (
                <li key={ev.uid}>
                  <strong>{ev.eventType}</strong>
                  <span className={styles.muted}>
                    {" "}
                    {ev.fromStatus || "—"} → {ev.toStatus || "—"}
                    {ev.message ? ` · ${ev.message}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
