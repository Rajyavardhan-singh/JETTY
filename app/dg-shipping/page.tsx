import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import styles from "./page.module.css";
import StcwCard from "@/app/components/dg-shipping/StcwCard";

export default async function DGShippingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("seafarer_profiles")
    .select("indos_number, date_of_birth")
    .eq("id", user.id)
    .single();

  return (
    <AppShellServer>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>DG Shipping Resources</h1>
          <p className={styles.subtitle}>
            Centralized access to the Directorate General of Shipping resources, certification management, and real-time maritime regulatory updates.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Static DG Website Card */}
          <a href="https://dgma.gov.in/" target="_blank" rel="noopener noreferrer" className={`${styles.card} ${styles.staticCard}`}>
            <div className={styles.cardIcon}>
              <span className="msi msi-lg" style={{ color: "var(--primary)", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>language</span>
            </div>
            <h3 className={styles.cardTitle}>DG Website</h3>
            <p className={styles.cardDesc}>
              Access the official portal for all national maritime policies and administrative resources.
            </p>
            <span className={styles.cardAction}>
              Visit Portal <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>open_in_new</span>
            </span>
          </a>

          {/* Dynamic STCW Certificate Component */}
          <StcwCard
            indosNumber={profile?.indos_number || null}
            dateOfBirth={profile?.date_of_birth || null}
          />

          {/* Static e-Governance Card */}
          <a href="http://220.156.189.33/esamudraUI/well.do?method=loadPage" target="_blank" rel="noopener noreferrer" className={`${styles.card} ${styles.staticCard}`}>
            <div className={styles.cardIcon}>
              <span className="msi msi-lg" style={{ color: "var(--secondary)", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>admin_panel_settings</span>
            </div>
            <h3 className={styles.cardTitle}>E-Governance</h3>
            <p className={styles.cardDesc}>
              Manage your Account, Exam applications, CDC, and update seafarer&apos;s profile efficiently via e-Samudra.
            </p>
            <span className={styles.cardAction}>
              Login via eSamudra <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>open_in_new</span>
            </span>
          </a>

          {/* Static Indos Checker Card */}
          <a href="http://220.156.189.33/esamudraUI/jsp/examination/checker/PP_IndosChecker.jsp" target="_blank" rel="noopener noreferrer" className={`${styles.card} ${styles.staticCard}`}>
            <div className={styles.cardIcon}>
              <span className="msi msi-lg" style={{ color: "var(--tertiary)", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>verified_user</span>
            </div>
            <h3 className={styles.cardTitle}>Indos Checker</h3>
            <p className={styles.cardDesc}>
              Instant verification of Indos number and maritime credentials. Check application status immediately.
            </p>
            <span className={styles.cardAction}>
              Verify Now <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>open_in_new</span>
            </span>
          </a>

          {/* Static DG Notifications */}
          <a href="https://www.dgshipping.gov.in/news.aspx" target="_blank" rel="noopener noreferrer" className={`${styles.card} ${styles.staticCard}`}>
            <div className={styles.cardIcon}>
              <span className="msi msi-lg" style={{ color: "var(--on-primary-container)", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48" }}>notifications</span>
            </div>
            <h3 className={styles.cardTitle}>DG Notifications</h3>
            <p className={styles.cardDesc}>
              View the most recent news updates, general alerts, and training directives hosted centrally.
            </p>
            <span className={styles.cardAction}>
              Read News <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>open_in_new</span>
            </span>
          </a>
        </div>

        {/* Placeholder section for Latest Circulars */}
        <section>
          <h2 className={styles.sectionTitle}>Latest Circulars &amp; Maritime Directives</h2>
          <div className={styles.comingSoonBox}>
            <span className="msi" style={{ fontSize: "2rem", color: "var(--outline)", display: "block", marginBottom: "1rem", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>construction</span>
            <h3 className={styles.csTitle}>Coming Soon</h3>
            <p className={styles.csSub}>
              We are working to integrate a live parsed feed of DGS Circulars, Notices directly into Jetty.
            </p>
          </div>
        </section>
      </div>
    </AppShellServer>
  );
}
