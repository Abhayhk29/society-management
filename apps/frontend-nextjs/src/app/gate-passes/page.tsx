"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/context/auth-context";
import {
  GatePass,
  Society,
  approveGatePass,
  cancelGatePass,
  createGatePass,
  getGatePass,
  listGatePasses,
  listSocieties,
  rejectGatePass,
  verifyGatePassQr,
} from "@/lib/api";
import { disconnectSocket, getSocket } from "@/lib/socket";
import styles from "./gate-passes.module.css";

export default function GatePassesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [societies, setSocieties] = useState<Society[]>([]);
  const [societyId, setSocietyId] = useState("");
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selected, setSelected] = useState<GatePass | null>(null);
  const [scanPayload, setScanPayload] = useState("");
  const [pending, setPending] = useState(false);

  const canCreate = Boolean(user?.permissions?.includes("create:gate_pass"));
  const canApprove = Boolean(user?.permissions?.includes("approve:gate_pass"));
  const canView = Boolean(user?.permissions?.includes("view:gate_pass"));

  const loadPasses = useCallback(
    async (sid: string) => {
      if (!token || !sid) return;
      const rows = await listGatePasses(sid, token);
      setPasses(rows);
    },
    [token],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !canView) return;
    void listSocieties(token)
      .then((rows) => {
        setSocieties(rows.filter((s) => s.isActive));
        if (rows[0]) {
          setSocietyId((prev) => prev || rows[0].uid);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load societies"),
      );
  }, [token, canView]);

  useEffect(() => {
    if (!societyId || !token) return;
    void loadPasses(societyId).catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load passes"),
    );
  }, [societyId, token, loadPasses]);

  useEffect(() => {
    if (!token || !societyId) return;
    const socket = getSocket(token);
    socket.emit("join_society", societyId);
    const refresh = (pass: GatePass) => {
      if (pass.societyId !== societyId) return;
      setPasses((prev) => {
        const idx = prev.findIndex((p) => p.uid === pass.uid);
        if (idx === -1) return [pass, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...pass, qrPayload: next[idx].qrPayload };
        return next;
      });
      setSelected((cur) =>
        cur?.uid === pass.uid ? { ...cur, ...pass, qrPayload: cur.qrPayload } : cur,
      );
    };
    socket.on("gate_pass.created", refresh);
    socket.on("gate_pass.updated", refresh);
    socket.on("gate_pass.scanned", refresh);
    return () => {
      socket.emit("leave_society", societyId);
      socket.off("gate_pass.created", refresh);
      socket.off("gate_pass.updated", refresh);
      socket.off("gate_pass.scanned", refresh);
    };
  }, [token, societyId]);

  useEffect(() => () => disconnectSocket(), []);

  const societyName = useMemo(
    () => societies.find((s) => s.uid === societyId)?.name ?? "",
    [societies, societyId],
  );

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!token || !societyId) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const created = await createGatePass(
        {
          societyId,
          visitorName,
          visitorPhone: visitorPhone || undefined,
          purpose: purpose || undefined,
        },
        token,
      );
      setMessage(`Pass created (${created.status})`);
      setVisitorName("");
      setVisitorPhone("");
      setPurpose("");
      await loadPasses(societyId);
      if (created.hasQrPayload || created.qrPayload) {
        setSelected(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setPending(false);
    }
  }

  async function openPass(uid: string) {
    if (!token) return;
    setError("");
    try {
      const pass = await getGatePass(uid, token);
      setSelected(pass);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pass");
    }
  }

  async function onApprove(uid: string) {
    if (!token) return;
    setPending(true);
    try {
      const pass = await approveGatePass(uid, token);
      setSelected(pass);
      setMessage("Pass approved — QR ready");
      await loadPasses(societyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setPending(false);
    }
  }

  async function onReject(uid: string) {
    if (!token) return;
    setPending(true);
    try {
      await rejectGatePass(uid, token, "Rejected at gate");
      setMessage("Pass rejected");
      setSelected(null);
      await loadPasses(societyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setPending(false);
    }
  }

  async function onCancel(uid: string) {
    if (!token) return;
    setPending(true);
    try {
      await cancelGatePass(uid, token);
      setMessage("Pass cancelled");
      setSelected(null);
      await loadPasses(societyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    } finally {
      setPending(false);
    }
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const res = await verifyGatePassQr(scanPayload, token);
      setMessage(res.message);
      if (res.gatePass) setSelected(res.gatePass);
      await loadPasses(societyId);
      setScanPayload("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verify failed");
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
        <p className={styles.error}>You do not have view:gate_pass permission.</p>
        <Link href="/dashboard">Back to dashboard</Link>
      </div>
    );
  }

  const qrValue = selected?.qrPayload || "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.brand}>Nivas</div>
          <p className={styles.muted}>Gate passes {societyName ? `· ${societyName}` : ""}</p>
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
                {s.name} ({s.code})
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
            <h2>Create visitor pass</h2>
            <label>
              Visitor name
              <input
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
              />
            </label>
            <label>
              Phone
              <input
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
              />
            </label>
            <label>
              Purpose
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </label>
            <button type="submit" disabled={pending || !societyId}>
              {pending ? "Saving…" : "Create pass"}
            </button>
          </form>
        ) : null}

        {canApprove ? (
          <form className={styles.card} onSubmit={onVerify}>
            <h2>Scan / verify QR</h2>
            <label>
              QR payload
              <textarea
                required
                rows={3}
                value={scanPayload}
                onChange={(e) => setScanPayload(e.target.value)}
                placeholder="gp.<id>.<exp>.<sig>"
              />
            </label>
            <button type="submit" disabled={pending}>
              Verify entry
            </button>
          </form>
        ) : null}

        <section className={styles.card}>
          <h2>Passes</h2>
          <ul className={styles.list}>
            {passes.map((pass) => (
              <li key={pass.uid}>
                <button type="button" onClick={() => void openPass(pass.uid)}>
                  <strong>{pass.visitorName}</strong>
                  <span>{pass.status}</span>
                </button>
              </li>
            ))}
            {passes.length === 0 ? (
              <li className={styles.muted}>No passes yet for this society.</li>
            ) : null}
          </ul>
        </section>

        {selected ? (
          <section className={styles.card}>
            <h2>{selected.visitorName}</h2>
            <p className={styles.muted}>
              {selected.status}
              {selected.purpose ? ` · ${selected.purpose}` : ""}
            </p>
            <p className={styles.metaLine}>
              Valid until {new Date(selected.validUntil).toLocaleString()}
            </p>
            {qrValue ? (
              <div className={styles.qr}>
                <QRCodeSVG value={qrValue} size={180} />
                <code>{qrValue}</code>
              </div>
            ) : (
              <p className={styles.muted}>
                QR appears after approval
                {selected.status === "PENDING" ? " (still pending)." : "."}
              </p>
            )}
            <div className={styles.actions}>
              {canApprove && selected.status === "PENDING" ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void onApprove(selected.uid)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={pending}
                    onClick={() => void onReject(selected.uid)}
                  >
                    Reject
                  </button>
                </>
              ) : null}
              {canCreate &&
              selected.status !== "USED" &&
              selected.status !== "CANCELLED" ? (
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={pending}
                  onClick={() => void onCancel(selected.uid)}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
