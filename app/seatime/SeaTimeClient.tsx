"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function SeaTimeClient() {
  const [signOn, setSignOn] = useState("");
  const [signOff, setSignOff] = useState("");

  const calculateDays = () => {
    if (!signOn) return { totalDays: 0, propellingDays: 0, isCurrent: false };

    const startDate = new Date(signOn);
    const endDate = signOff ? new Date(signOff) : new Date();

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < startDate) return { totalDays: 0, propellingDays: 0, isCurrent: false };

    const diffInMs = endDate.getTime() - startDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24)) + 1;
    const propellingDays = Math.round(diffInDays * 0.85);

    return { totalDays: diffInDays, propellingDays, isCurrent: !signOff };
  };

  const { totalDays, propellingDays, isCurrent } = calculateDays();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <span className="msi" style={{ fontSize: "2rem", color: "var(--primary)", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>calculate</span>
        </div>
        <h1 className={styles.title}>Sea Time Calculator</h1>
        <p className={styles.subtitle}>
          Quickly calculate total days and propelling days from your sign-on and sign-off dates.
        </p>
      </div>

      <div className={styles.calculatorCard}>
        <div className={styles.inputGrid}>
          <div className={styles.field}>
            <label className={styles.label}>
              <span className="msi msi-sm" style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: "6px" }}>login</span>
              Sign On Date
            </label>
            <input
              type="date"
              className={styles.input}
              value={signOn}
              onChange={(e) => setSignOn(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              <span className="msi msi-sm" style={{ color: "var(--secondary)", verticalAlign: "middle", marginRight: "6px" }}>logout</span>
              Sign Off Date
            </label>
            <input
              type="date"
              className={styles.input}
              value={signOff}
              onChange={(e) => setSignOff(e.target.value)}
            />
          </div>
        </div>

        {(signOn || signOff) && (
          <button className={styles.resetBtn} onClick={() => { setSignOn(""); setSignOff(""); }}>
            <span className="msi msi-sm">restart_alt</span> Reset Dates
          </button>
        )}

        <div className={styles.resultsArea}>
          <div className={styles.resultBox}>
            <div>
              <div className={styles.resultLabel}>
                <span className="msi msi-sm" style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: "4px" }}>schedule</span>
                Total Sea Time
              </div>
              {isCurrent && totalDays > 0 && (
                <div className={styles.propellingNote}>calculated till today</div>
              )}
            </div>
            <div className={`${styles.resultValue} ${styles.resultValuePrimary}`}>
              {totalDays} <span style={{ fontSize: "1rem", fontWeight: "normal", color: "var(--on-surface-variant)" }}>Days</span>
            </div>
          </div>

          <div className={styles.resultBox}>
            <div>
              <div className={styles.resultLabel}>
                <span className="msi msi-sm" style={{ color: "var(--secondary)", verticalAlign: "middle", marginRight: "4px" }}>sailing</span>
                Propelling Days
              </div>
              <div className={styles.propellingNote}>(Calculated as 85% of total days)</div>
            </div>
            <div className={styles.resultValue}>
              {propellingDays} <span style={{ fontSize: "1rem", fontWeight: "normal", color: "var(--on-surface-variant)" }}>Days</span>
            </div>
          </div>
        </div>

        <p className={styles.disclaimer}>
          * Disclaimer: Total number of days is calculated by taking both the Sign On and Sign Off dates into account (inclusive logic).
        </p>
      </div>
    </div>
  );
}
