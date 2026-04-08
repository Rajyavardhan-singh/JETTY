"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/profile");
      router.refresh();
    }
  }

  return (
    <div className={styles.loginContainer}>
      {/* Background Elements */}
      <div className={styles.bgElements}>
        <div className={styles.bgLeft}>
          <Image
            className={styles.bgImage}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwGZfDZTnllZ36hK1eUDFwvu9VRgOLAdcmwpiAQgdJ9CIiA2TzHn6pWma4tZ0CKtbYyuj-mR8i6QkRFES145C3Jpi2kOzpezfmUkZhiXa6bOswVv7JLo0wXhApcJJfIT2HMulzrh-0PMHM6L18ndYkmZPL4O9oe3vkPsjgGn9QqrIvL44rBuj_I7mQ1HptODbi4EaN-3IsNLOlcEnoF-rDNxTUGSdqCQb_4XiXh65Oa74QOdwDlIfBvx08YYgbwOzVr-fRqQeEg0NY"
            alt="Modern ship bridge with glowing blue consoles at night"
            fill
            sizes="50vw"
          />
          <div className={styles.gradientOverlayLeft}></div>
        </div>
        <div className={styles.bgRight}>
          <Image
            className={styles.bgImage}
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBseviNL0vhNb7DZKJcUG2DzNvJEoURph8B9myPWZtItG-hzC_ZYg-AYADT7vpqGE111KZxr65ySZGhlBChL_kXq0cpa_jNQn8qHbrtTIDz_FR1809SUHm9wam3xZQn-NBDG8TiDQLJwYW4IlH3JQ6kYv-ygF3F0-njiVDqUtn5obiUStu6J5WsNrpNnfQxrsYExsmTLmVkmdDSYxsME9OzxbgW4NR6gSJCBdu11WIIka7NM8x5N3MQNPsYO3jq_i-tL6qRZpD3m-cf"
            alt="High-tech industrial engine room"
            fill
            sizes="50vw"
          />
          <div className={styles.gradientOverlayRight}></div>
        </div>
        <div className={styles.gradientOverlayBottom}></div>
        <div className={styles.gradientOverlayCenter}></div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>JETTY</div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.glassPanel}>
                  <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div className={styles.iconWrapper}>
              <span className="msi msi-lg" style={{ color: "var(--primary)", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>anchor</span>
            </div>
            <h1 className={styles.pageTitle}>Command Bridge</h1>
            <p className={styles.subtitle}>Secure access for verified maritime personnel</p>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">Vessel ID / Email</label>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <span className="msi msi-sm" style={{ color: "var(--outline)" }}>alternate_email</span>
                </div>
                <input
                  className={styles.input}
                  id="email"
                  name="email"
                  placeholder="e.g. j.doe@vessel.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelWrapper}>
                <label className={styles.label} htmlFor="password" style={{ margin: 0 }}>Security Key</label>
                <Link href="#" className={styles.forgotLink}>Forgot?</Link>
              </div>
              <div className={styles.inputWrapper}>
                <div className={styles.inputIcon}>
                  <span className="msi msi-sm" style={{ color: "var(--outline)" }}>lock</span>
                </div>
                <input
                  className={styles.input}
                  id="password"
                  name="password"
                  placeholder="••••••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ paddingTop: "1rem" }}>
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                <span>{loading ? "Authenticating..." : "Login"}</span>
                {!loading && <span className="msi msi-sm">east</span>}
              </button>
            </div>
          </form>

          <div className={styles.signUpText}>
            Don&apos;t have an account?
            <Link href="/signup" className={styles.signUpLink}>Sign Up</Link>
          </div>
        </div>

        <div className={styles.statusBadges}>
          <div className={styles.statusBadge}>
            <span className={styles.statusIndicator}></span>
            <span className={styles.statusText}>Satellite Link: Active</span>
          </div>
          <div className={styles.statusBadge}>
            <span className={styles.statusIndicator}></span>
            <span className={styles.statusText}>Auth Grid: Online</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerCopyright}>© 2026 Jetty. All rights reserved.</div>
        <nav className={styles.footerNav}>
          <Link href="#" className={styles.footerLink}>Privacy Policy</Link>
          <Link href="#" className={styles.footerLink}>Terms of Service</Link>
          <Link href="#" className={styles.footerLink}>Maritime Regulations</Link>
        </nav>
      </footer>
    </div>
  );
}
