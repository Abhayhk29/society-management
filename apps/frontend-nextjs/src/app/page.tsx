"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import styles from "./page.module.css";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <div className={styles.shell}>
      <header className={styles.nav}>
        <div className={styles.brand}>Nivas</div>
        <div className={styles.navActions}>
          <Link className={styles.btnGhost} href="/login">
            Sign in
          </Link>
          <Link className={styles.btn} href="/register">
            Create account
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <h1>Nivas</h1>
        <p>
          One calm place for society residents, guards, and admins — starting with
          secure sign-in and role-aware access.
        </p>
        <div className={styles.ctaRow}>
          <Link className={styles.btn} href="/register">
            Get started
          </Link>
          <Link className={styles.btnGhost} href="/login">
            I already have an account
          </Link>
        </div>
      </section>
    </div>
  );
}
