"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Society,
  SocietyInsightsResponse,
  getSocietyInsights,
  listSocieties,
} from "@/lib/api";
import styles from "../gate-passes/gate-passes.module.css";

export default function InsightsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState("");
  const [result, setResult] = useState<SocietyInsightsResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const canView = Boolean(user?.permissions?.includes("view:analytics"));

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

  useEffect(() => {
    if (!token || !societyId || !canView) return;
    setPending(true);
    void getSocietyInsights(societyId, token)
      .then(setResult)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setPending(false));
  }, [token, societyId, canView]);

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
        <p className={styles.error}>Missing view:analytics permission.</p>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>Society insights</p>
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
        <button
          type="button"
          disabled={pending || !societyId}
          onClick={() => {
            if (!token || !societyId) return;
            setPending(true);
            void getSocietyInsights(societyId, token)
              .then(setResult)
              .catch((e) =>
                setError(e instanceof Error ? e.message : "Failed"),
              )
              .finally(() => setPending(false));
          }}
        >
          Refresh
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {pending ? <p className={styles.muted}>Generating insights…</p> : null}

      {result ? (
        <div className={styles.grid}>
          <section className={styles.card}>
            <h2>Summary</h2>
            <p>{result.summary}</p>
            <p className={styles.muted}>
              Model {result.model} · {result.generatedAt}
            </p>
          </section>
          <section className={styles.card}>
            <h2>Insights</h2>
            <ul className={styles.list}>
              {result.insights?.map((item, idx) => (
                <li key={`${item.title}-${idx}`}>
                  <strong>
                    [{item.severity}] {item.title}
                  </strong>
                  <span>
                    {item.category} · {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
