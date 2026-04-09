"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength =
    password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 10 ? 2 :
    password.match(/[A-Z]/) && password.match(/[0-9]/) ? 4 : 3;

  // Confirm password match state (only show icon after user has typed something)
  const confirmTouched = confirmPassword.length > 0;
  const confirmMatch = confirmTouched && password === confirmPassword;
  const confirmMismatch = confirmTouched && password !== confirmPassword;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage("Account created! Check your email to confirm, then log in.");
      setLoading(false);
    }
  }

  function handleOpenEmailApp() {
    // Open device email app
    window.location.href = "mailto:";
    // Navigate to login page
    router.push("/login");
  }

  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#ff6b6b", "#ffa94d", "#91cdff", "#5bdbc2"];

  return (
    <div className={styles.signupContainer}>
      {/* Ambient glow blobs */}
      <div className={styles.blobLeft}></div>
      <div className={styles.blobRight}></div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTitle}>JETTY</div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.glassPanel}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h1 className={styles.pageTitle}>Create Account</h1>
            <p className={styles.subtitle}>Join the modern seafarer network</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}
          {message && (
            <div className={styles.successBanner}>
              <p style={{ marginBottom: "1rem" }}>{message}</p>
              <button
                type="button"
                onClick={handleOpenEmailApp}
                className={styles.openEmailBtn}
              >
                <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>mail</span>
                {" "}Open Email App
              </button>
            </div>
          )}

          {!message && (
            <form onSubmit={handleSignup}>
              {/* Email */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">Email ID</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <span className="msi msi-sm" style={{ color: "var(--outline)" }}>mail</span>
                  </div>
                  <input
                    className={styles.input}
                    id="email"
                    type="email"
                    placeholder="mariner@vessel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="password">Create Password</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <span className="msi msi-sm" style={{ color: "var(--outline)" }}>lock</span>
                  </div>
                  <input
                    className={styles.input}
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div className={styles.strengthBar}>
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={styles.strengthSegment}
                          style={{
                            backgroundColor:
                              passwordStrength >= level
                                ? strengthColors[passwordStrength]
                                : "var(--surface-container-high)",
                          }}
                        />
                      ))}
                    </div>
                    <p className={styles.strengthLabel} style={{ color: strengthColors[passwordStrength] }}>
                      {strengthLabels[passwordStrength]} Security Rating
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="confirm">Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <span className="msi msi-sm" style={{ color: "var(--outline)" }}>lock</span>
                  </div>
                  <input
                    className={styles.input}
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ paddingRight: confirmTouched ? "3rem" : undefined }}
                  />
                  {/* Tick / cross icon inside the field on the right */}
                  {confirmTouched && (
                    <div className={styles.confirmIcon}>
                      <span
                        className="msi msi-sm"
                        style={{
                          color: confirmMatch ? "#4ade80" : "#ff6b6b",
                          fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24",
                          transition: "color 0.2s",
                        }}
                      >
                        {confirmMatch ? "check_circle" : "cancel"}
                      </span>
                    </div>
                  )}
                </div>
                {confirmMismatch && (
                  <p style={{ fontSize: "0.6875rem", color: "#ff6b6b", marginTop: "0.25rem", marginLeft: "0.25rem" }}>
                    Passwords do not match
                  </p>
                )}
              </div>

              <button className={styles.submitBtn} type="submit" disabled={loading}>
                <span>{loading ? "Creating Account..." : "Sign Up"}</span>
                {!loading && <span className="msi msi-sm">east</span>}
              </button>
            </form>
          )}

          <div className={styles.divider}></div>
          <p className={styles.loginText}>
            Already have an account?
            <Link href="/login" className={styles.loginLink}>Login</Link>
          </p>
        </div>

        {/* Info note */}
        <div className={styles.infoNote}>
          <span className={styles.infoIcon}>ℹ</span>
          <p className={styles.infoText}>
            By signing up, you agree to the{" "}
            <Link href="#" style={{ textDecoration: "underline" }}>Maritime Regulations</Link>{" "}
            and safety protocols of the Jetty ecosystem.
          </p>
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
