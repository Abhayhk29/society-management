"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Complaint,
  Notice,
  Society,
  Visitor,
  checkInVisitor,
  checkOutVisitor,
  createComplaint,
  createNotice,
  createVisitor,
  listComplaints,
  listNotices,
  listSocieties,
  listVisitors,
} from "@/lib/api";
import styles from "../gate-passes/gate-passes.module.css";

type Tab = "notices" | "complaints" | "visitors";

export default function CommunityPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("notices");
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState("");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorWhen, setVisitorWhen] = useState(
    new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  );

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!token) return;
    void listSocieties(token).then((rows) => {
      setSocieties(rows.filter((s) => s.isActive));
      if (rows[0]) setSocietyId((p) => p || rows[0].uid);
    });
  }, [token]);

  async function refresh(sid: string) {
    if (!token || !sid) return;
    const [n, c, v] = await Promise.all([
      user?.permissions?.includes("view:notice")
        ? listNotices(sid, token)
        : Promise.resolve([]),
      user?.permissions?.includes("view:complaint")
        ? listComplaints(sid, token)
        : Promise.resolve([]),
      user?.permissions?.includes("view:visitor")
        ? listVisitors(sid, token)
        : Promise.resolve([]),
    ]);
    setNotices(n);
    setComplaints(c);
    setVisitors(v);
  }

  useEffect(() => {
    void refresh(societyId).catch((e) =>
      setError(e instanceof Error ? e.message : "Load failed"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societyId, token]);

  async function onNotice(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    try {
      await createNotice(
        { societyId, title: noticeTitle, body: noticeBody, priority: "NORMAL" },
        token,
      );
      setNoticeTitle("");
      setNoticeBody("");
      setMessage("Notice published");
      await refresh(societyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function onComplaint(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    try {
      await createComplaint(
        {
          societyId,
          category: "GENERAL",
          title: complaintTitle,
          description: complaintDesc,
        },
        token,
      );
      setComplaintTitle("");
      setComplaintDesc("");
      setMessage("Complaint raised");
      await refresh(societyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setPending(false);
    }
  }

  async function onVisitor(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    try {
      await createVisitor(
        {
          societyId,
          visitorName,
          expectedAt: new Date(visitorWhen).toISOString(),
        },
        token,
      );
      setVisitorName("");
      setMessage("Visitor scheduled");
      await refresh(societyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>Community</p>
        </div>
        <Link className={styles.linkBtn} href="/dashboard">
          Dashboard
        </Link>
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

      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        {(["notices", "complaints", "visitors"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? undefined : styles.secondary}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <div className={styles.grid}>
        {tab === "notices" ? (
          <>
            {user.permissions?.includes("manage:notice") ? (
              <form className={styles.card} onSubmit={onNotice}>
                <h2>Publish notice</h2>
                <label>
                  Title
                  <input
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                  />
                </label>
                <label>
                  Body
                  <textarea
                    required
                    rows={3}
                    value={noticeBody}
                    onChange={(e) => setNoticeBody(e.target.value)}
                  />
                </label>
                <button type="submit" disabled={pending}>
                  Publish
                </button>
              </form>
            ) : null}
            <section className={styles.card}>
              <h2>Notices</h2>
              <ul className={styles.list}>
                {notices.map((n) => (
                  <li key={n.uid}>
                    <strong>{n.title}</strong>
                    <p className={styles.muted}>{n.body}</p>
                  </li>
                ))}
                {notices.length === 0 ? (
                  <li className={styles.muted}>No notices.</li>
                ) : null}
              </ul>
            </section>
          </>
        ) : null}

        {tab === "complaints" ? (
          <>
            {user.permissions?.includes("create:complaint") ? (
              <form className={styles.card} onSubmit={onComplaint}>
                <h2>Raise complaint</h2>
                <label>
                  Title
                  <input
                    required
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    required
                    rows={3}
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                  />
                </label>
                <button type="submit" disabled={pending}>
                  Submit
                </button>
              </form>
            ) : null}
            <section className={styles.card}>
              <h2>Complaints</h2>
              <ul className={styles.list}>
                {complaints.map((c) => (
                  <li key={c.uid}>
                    <strong>{c.title}</strong>
                    <span>{c.status}</span>
                  </li>
                ))}
                {complaints.length === 0 ? (
                  <li className={styles.muted}>No complaints.</li>
                ) : null}
              </ul>
            </section>
          </>
        ) : null}

        {tab === "visitors" ? (
          <>
            {user.permissions?.includes("manage:visitor") ? (
              <form className={styles.card} onSubmit={onVisitor}>
                <h2>Schedule visitor</h2>
                <label>
                  Name
                  <input
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                  />
                </label>
                <label>
                  Expected at
                  <input
                    required
                    type="datetime-local"
                    value={visitorWhen}
                    onChange={(e) => setVisitorWhen(e.target.value)}
                  />
                </label>
                <button type="submit" disabled={pending}>
                  Schedule
                </button>
              </form>
            ) : null}
            <section className={styles.card}>
              <h2>Visitors</h2>
              <ul className={styles.list}>
                {visitors.map((v) => (
                  <li key={v.uid}>
                    <div>
                      <strong>{v.visitorName}</strong>
                      <span> {v.status}</span>
                    </div>
                    {user.permissions?.includes("manage:visitor") ? (
                      <div className={styles.actions}>
                        {v.status === "EXPECTED" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void checkInVisitor(v.uid, token!).then(() =>
                                refresh(societyId),
                              )
                            }
                          >
                            Check in
                          </button>
                        ) : null}
                        {v.status === "CHECKED_IN" ? (
                          <button
                            type="button"
                            onClick={() =>
                              void checkOutVisitor(v.uid, token!).then(() =>
                                refresh(societyId),
                              )
                            }
                          >
                            Check out
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
                {visitors.length === 0 ? (
                  <li className={styles.muted}>No visitors.</li>
                ) : null}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
