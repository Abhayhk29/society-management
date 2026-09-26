"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { AuthResponse, sendOtp, verifyOtp } from "@/lib/api";
import styles from "../auth.module.css";

export default function OtpLoginPage() {
  const { applySession } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSend(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      const res = await sendOtp(phoneNumber, "LOGIN");
      setSent(true);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send OTP");
    } finally {
      setPending(false);
    }
  }

  async function onVerify(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      const res = await verifyOtp({
        phoneNumber,
        purpose: "LOGIN",
        code,
      });
      if ("accessToken" in res) {
        applySession(res as AuthResponse);
        router.replace("/dashboard");
        return;
      }
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>Nivas</div>
        <p className={styles.lead}>Sign in with a one-time code sent by SMS.</p>
        {!sent ? (
          <form className={styles.form} onSubmit={onSend}>
            <div className={styles.field}>
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={onVerify}>
            <div className={styles.field}>
              <label htmlFor="code">OTP code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                required
                minLength={4}
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {error ? <p className={styles.error}>{error}</p> : null}
            {message ? <p className={styles.success}>{message}</p> : null}
            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? "Verifying…" : "Verify & sign in"}
            </button>
          </form>
        )}
        <p className={styles.footer}>
          Prefer password? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
