"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import styles from "../../dg-shipping/page.module.css";

// Static STCW base URL for unauthenticated users (same UX as Indos Checker)
const STCW_STATIC_URL =
  "http://220.156.189.33/esamudraUI/jsp/examination/checker/StcwCourse.jsp";

interface StcwCardProps {
  indosNumber: string | null;
  dateOfBirth: string | null;
  /** When false, clicking opens a static link (no profile data needed). */
  isLoggedIn: boolean;
}

export default function StcwCard({ indosNumber, dateOfBirth, isLoggedIn }: StcwCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ indos: indosNumber || "", dob: dateOfBirth || "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Helper to format date string: converts YYYY-MM-DD to DD/MM/YYYY
  const formatDob = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const getSystemDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return encodeURIComponent(`${dd}/${mm}/${yyyy}`);
  };

  const generateLink = (indos: string, dobObj: string) => {
    const formattedDob = encodeURIComponent(formatDob(dobObj));
    const formattedIndos = encodeURIComponent(indos);
    return `http://220.156.189.33/esamudraUI/jsp/examination/checker/StcwCourse.jsp?hidSystemDate=${getSystemDate()}&hidSystemDate1=&hidProcessId=&cmbSearch_by=CRSE&txtNo=${formattedIndos}&txtDob=${formattedDob}&certNo=`;
  };

  const handleClick = () => {
    if (!isLoggedIn) {
      // Guest: open static URL (same as Indos Checker)
      window.open(STCW_STATIC_URL, "_blank");
      return;
    }
    if (indosNumber && dateOfBirth) {
      window.open(generateLink(indosNumber, dateOfBirth), "_blank");
    } else {
      setShowModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("Authentication failed.");

      if (!form.indos.trim() || !form.dob.trim()) {
        throw new Error("Both INDOS Number and Date of Birth are required.");
      }

      const { error: updateErr } = await supabase
        .from("seafarer_profiles")
        .update({
          indos_number: form.indos,
          date_of_birth: form.dob,
        })
        .eq("id", user.id);

      if (updateErr) throw new Error("Failed to update profile: " + updateErr.message);

      setShowModal(false);
      router.refresh(); // Refresh server props

      // Auto redirect
      window.open(generateLink(form.indos, form.dob), "_blank");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.interactiveCard} onClick={handleClick}>
        <div className={styles.cardIcon}>
          <span className="msi msi-lg" style={{ color: "var(--secondary)", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>task_alt</span>
        </div>
        <h3 className={styles.cardTitle}>STCW &amp; Course Certificates</h3>
        <p className={styles.cardDesc}>
          View, download, and Print STCW course certificates.
        </p>
        <span className={styles.cardAction}>
          Verify Now <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>open_in_new</span>
        </span>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Profile Information Required</h2>
            <p className={styles.modalSub}>
              We need your INDOS Number and Date of Birth to dynamically map your DG Shipping course records. They will be securely saved to your profile for future use.
            </p>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>INDOS Number</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. 24EM1741"
                  value={form.indos}
                  onChange={(e) => setForm({ ...form, indos: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  className={styles.input}
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.btnSave} disabled={loading}>
                  {loading ? "Saving..." : "Save & Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
