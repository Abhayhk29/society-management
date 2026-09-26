"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPassword } from "@/lib/api";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>Nivas</div>
        <p className={styles.lead}>
          Enter your email and we&apos;ll send a password reset link.
        </p>
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.success}>{message}</p> : null}
          <button className={styles.submit} type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <p className={styles.footer}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
