"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { resetPassword } from "@/lib/api";
import styles from "../auth.module.css";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);
    try {
      const res = await resetPassword(token, password);
      setMessage(res.message);
      setTimeout(() => router.replace("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.brand}>Nivas</div>
      <p className={styles.lead}>Choose a new password for your account.</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label htmlFor="token">Reset token</label>
          <input
            id="token"
            type="text"
            required
            minLength={20}
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className={styles.error}>{error}</p> : null}
        {message ? <p className={styles.success}>{message}</p> : null}
        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className={styles.footer}>
        <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <Suspense fallback={<div className={styles.panel}>Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
