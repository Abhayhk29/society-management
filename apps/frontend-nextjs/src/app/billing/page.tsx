"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Bill,
  Receipt,
  Society,
  createBill,
  downloadReceiptPdf,
  listBills,
  listReceipts,
  listSocieties,
  payBill,
} from "@/lib/api";
import styles from "../gate-passes/gate-passes.module.css";

export default function BillingPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState("");
  const [bills, setBills] = useState<Bill[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("1000");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  );
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const canCreate = Boolean(user?.permissions?.includes("create:bills"));
  const canPay = Boolean(user?.permissions?.includes("pay:bills"));
  const canView = Boolean(user?.permissions?.includes("view:bills"));

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
    if (!token || !societyId) return;
    void Promise.all([
      listBills(societyId, token),
      listReceipts(societyId, token),
    ])
      .then(([b, r]) => {
        setBills(b);
        setReceipts(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [token, societyId]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    setError("");
    try {
      await createBill(
        {
          societyId,
          title,
          amount: Number(amount),
          dueDate,
          category: "MAINTENANCE",
        },
        token,
      );
      setMessage("Bill issued");
      setTitle("");
      setBills(await listBills(societyId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function onPay(e: FormEvent) {
    e.preventDefault();
    if (!token || !selectedBill) return;
    setPending(true);
    setError("");
    try {
      const payment = await payBill(
        selectedBill.uid,
        {
          amount: Number(payAmount || selectedBill.amount),
          method: payMethod,
          reference: "Nivas-manual",
        },
        token,
      );
      setMessage(
        `Paid — receipt ${payment.receiptNumber ?? payment.uid.slice(0, 8)}`,
      );
      setBills(await listBills(societyId, token));
      setReceipts(await listReceipts(societyId, token));
      setSelectedBill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pay failed");
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
        <p className={styles.error}>Missing view:bills permission.</p>
        <Link href="/dashboard">Dashboard</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>Billing</p>
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

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      <div className={styles.grid}>
        {canCreate ? (
          <form className={styles.card} onSubmit={onCreate}>
            <h2>Issue bill</h2>
            <label>
              Title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label>
              Amount
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label>
              Due date
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
            <button type="submit" disabled={pending}>
              Create & issue
            </button>
          </form>
        ) : null}

        <section className={styles.card}>
          <h2>Bills</h2>
          <ul className={styles.list}>
            {bills.map((bill) => (
              <li key={bill.uid}>
                <button type="button" onClick={() => setSelectedBill(bill)}>
                  <strong>{bill.title}</strong>
                  <span>
                    {bill.status} · {bill.currency} {bill.amount}
                  </span>
                </button>
              </li>
            ))}
            {bills.length === 0 ? (
              <li className={styles.muted}>No bills yet.</li>
            ) : null}
          </ul>
        </section>

        {selectedBill && canPay && selectedBill.status !== "PAID" ? (
          <form className={styles.card} onSubmit={onPay}>
            <h2>Pay {selectedBill.title}</h2>
            <p className={styles.muted}>
              Remaining{" "}
              {(
                selectedBill.amount - (selectedBill.paidAmount ?? 0)
              ).toFixed(2)}
            </p>
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                placeholder={String(selectedBill.amount)}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </label>
            <label>
              Method
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
              >
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MANUAL">Manual</option>
              </select>
            </label>
            <button type="submit" disabled={pending}>
              Record payment
            </button>
          </form>
        ) : null}

        <section className={styles.card}>
          <h2>Receipts (PDF)</h2>
          <ul className={styles.list}>
            {receipts.map((r) => (
              <li key={r.uid}>
                <div>
                  <strong>{r.receiptNumber}</strong>
                  <span className={styles.muted}> {r.issuedAt}</span>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    onClick={() =>
                      void downloadReceiptPdf(r.uid, token!)
                        .then(() => setMessage(`Downloaded ${r.receiptNumber}`))
                        .catch((e) =>
                          setError(
                            e instanceof Error ? e.message : "PDF failed",
                          ),
                        )
                    }
                  >
                    Download PDF
                  </button>
                </div>
              </li>
            ))}
            {receipts.length === 0 ? (
              <li className={styles.muted}>No receipts yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
