"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Society,
  Vendor,
  VendorDocument,
  addVendorDocument,
  assignVendorSociety,
  createVendor,
  listSocieties,
  listVendorDocuments,
  listVendors,
  reviewVendor,
  submitVendor,
  verifyVendorDocument,
} from "@/lib/api";
import styles from "../gate-passes/gate-passes.module.css";

export default function VendorsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [docs, setDocs] = useState<VendorDocument[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [categories, setCategories] = useState("PLUMBING");
  const [docLabel, setDocLabel] = useState("GST certificate");
  const [docRef, setDocRef] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const canView = Boolean(user?.permissions?.includes("view:vendor"));
  const canManage = Boolean(user?.permissions?.includes("manage:vendor"));

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

  async function refresh() {
    if (!token) return;
    setVendors(await listVendors(token));
  }

  useEffect(() => {
    void refresh().catch((e) =>
      setError(e instanceof Error ? e.message : "Load failed"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function selectVendor(v: Vendor) {
    setSelected(v);
    if (!token) return;
    setDocs(await listVendorDocuments(v.uid, token));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    setError("");
    try {
      const v = await createVendor(
        {
          displayName,
          companyName,
          categories,
          submitNow: true,
        },
        token,
      );
      setMessage(`Vendor ${v.displayName} submitted for review`);
      setDisplayName("");
      setCompanyName("");
      await refresh();
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
        <p className={styles.error}>Missing view:vendor permission.</p>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>Vendor onboarding</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.linkBtn} href="/work-orders">
            Work orders
          </Link>
          <Link className={styles.linkBtn} href="/dashboard">
            Dashboard
          </Link>
        </div>
      </header>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <div className={styles.grid}>
        {canManage ? (
          <form className={styles.card} onSubmit={onCreate}>
            <h2>Onboard vendor</h2>
            <label>
              Display name
              <input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label>
              Company
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <label>
              Categories
              <select
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
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
              Create & submit
            </button>
          </form>
        ) : null}

        <section className={styles.card}>
          <h2>Vendors</h2>
          <ul className={styles.list}>
            {vendors.map((v) => (
              <li key={v.uid}>
                <button type="button" onClick={() => void selectVendor(v)}>
                  <strong>{v.displayName}</strong>
                  <span>
                    {v.status} · {v.categories}
                  </span>
                </button>
              </li>
            ))}
            {vendors.length === 0 ? (
              <li className={styles.muted}>No vendors yet.</li>
            ) : null}
          </ul>
        </section>

        {selected ? (
          <section className={styles.card}>
            <h2>{selected.displayName}</h2>
            <p className={styles.muted}>
              {selected.companyName} · {selected.status}
            </p>

            {canManage ? (
              <div className={styles.actions}>
                {selected.status === "DRAFT" ||
                selected.status === "REJECTED" ? (
                  <button
                    type="button"
                    onClick={() =>
                      void submitVendor(selected.uid, token!).then(async (v) => {
                        setSelected(v);
                        setMessage("Submitted for review");
                        await refresh();
                      })
                    }
                  >
                    Submit
                  </button>
                ) : null}
                {selected.status === "PENDING_REVIEW" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        void reviewVendor(
                          selected.uid,
                          { approve: true },
                          token!,
                        ).then(async (v) => {
                          setSelected(v);
                          setMessage("Approved");
                          await refresh();
                        })
                      }
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() =>
                        void reviewVendor(
                          selected.uid,
                          { approve: false, rejectionReason: "Incomplete KYC" },
                          token!,
                        ).then(async (v) => {
                          setSelected(v);
                          setMessage("Rejected");
                          await refresh();
                        })
                      }
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {selected.status === "APPROVED" ? (
                  <>
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
                      onClick={() =>
                        void assignVendorSociety(
                          selected.uid,
                          societyId,
                          token!,
                        ).then(() =>
                          setMessage("Assigned to society"),
                        )
                      }
                    >
                      Assign to society
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}

            <h3 style={{ marginTop: "1.25rem" }}>KYC documents</h3>
            <ul className={styles.list}>
              {docs.map((d) => (
                <li key={d.uid}>
                  <div>
                    <strong>
                      {d.docType}: {d.label}
                    </strong>
                    <span> {d.status}</span>
                  </div>
                  {canManage && d.status === "SUBMITTED" ? (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={() =>
                          void verifyVendorDocument(d.uid, true, token!).then(
                            async () => {
                              setDocs(
                                await listVendorDocuments(selected.uid, token!),
                              );
                              setMessage("Document verified");
                            },
                          )
                        }
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={() =>
                          void verifyVendorDocument(d.uid, false, token!).then(
                            async () => {
                              setDocs(
                                await listVendorDocuments(selected.uid, token!),
                              );
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
              {docs.length === 0 ? (
                <li className={styles.muted}>No documents.</li>
              ) : null}
            </ul>

            {canManage ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void addVendorDocument(
                    selected.uid,
                    {
                      docType: "GST",
                      label: docLabel,
                      referenceOrUrl: docRef || "pending-upload",
                    },
                    token!,
                  ).then(async () => {
                    setDocRef("");
                    setDocs(await listVendorDocuments(selected.uid, token!));
                    setMessage("Document added");
                  });
                }}
              >
                <label>
                  Doc label
                  <input
                    required
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                  />
                </label>
                <label>
                  Reference / URL
                  <input
                    value={docRef}
                    onChange={(e) => setDocRef(e.target.value)}
                    placeholder="GSTIN or link"
                  />
                </label>
                <button type="submit">Add document</button>
              </form>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
