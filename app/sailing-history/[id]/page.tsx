import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import DeleteShipButton from "@/app/components/sailing/DeleteShipButton";
import styles from "./page.module.css";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatSalary(amount: number | null, currency: string | null) {
  if (!amount) return null;
  const sym: Record<string, string> = { USD: "$", EUR: "€", INR: "₹" };
  const symbol = sym[currency ?? "USD"] ?? "";
  return `${symbol}${amount.toLocaleString("en-IN")} / month`;
}

export default async function VesselDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ship } = await supabase
    .from("sailing_history")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ship) notFound();

  const today = new Date();
  const isOnBoard = !!ship.sign_on_date && !ship.sign_off_date;
  const days = ship.sign_on_date
    ? Math.max(0, Math.round(
      ((ship.sign_off_date ? new Date(ship.sign_off_date) : today).getTime()
        - new Date(ship.sign_on_date).getTime()) / 86_400_000
    ))
    : null;

  const personnel: { role: string; name: string }[] = Array.isArray(ship.personnel) ? ship.personnel : [];
  const documents: { title: string; url: string; kind: "link" | "pdf"; size_label?: string }[] =
    Array.isArray(ship.documents) ? ship.documents : [];
  const salary = formatSalary(ship.salary_amount, ship.salary_currency);

  return (
    <AppShellServer>
      <div className={styles.page}>
        <main className={styles.main}>
          {/* Hero header */}
          <header className={styles.hero}>
            <div>
              <Link href="/sailing-history" className={styles.backLink}>
                <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>arrow_back</span> All Vessels
              </Link>
              <h1 className={styles.vesselName}>{ship.vessel_name}</h1>
              <div className={styles.heroMeta}>
                {ship.imo_number && <span className={styles.imoBadge}>IMO {ship.imo_number}</span>}
                {ship.vessel_type && <span className={styles.typeText}>{ship.vessel_type}</span>}
                {isOnBoard && (
                  <span className={styles.onBoardBadge}>
                    <span className={styles.onBoardDot} />
                    On Board
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Bento grid */}
          <div className={styles.bentoGrid}>
            {/* Left col */}
            <div className={styles.leftCol}>
              {/* Vessel Image */}
              <div className={styles.imageCard}>
                {ship.vessel_image_url ? (
                  <Image src={ship.vessel_image_url} alt={ship.vessel_name} fill style={{ objectFit: "cover" }} unoptimized />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span className="msi" style={{ fontSize: "3.5rem", color: "var(--outline)" }}>directions_boat</span>
                  </div>
                )}
              </div>

              {/* Registry & Service */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}><span className={styles.cardIcon}>ℹ</span> Registry & Service</h3>
                <div className={styles.infoList}>
                  {[
                    { label: "Managing Company", value: ship.company },
                    { label: "Port of Registry", value: ship.port_of_registry },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className={styles.infoRow}>
                      <p className={styles.infoLabel}>{label}</p>
                      <p className={styles.infoValue}>{value}</p>
                    </div>
                  ) : null)}

                  {/* Salary */}
                  {salary && (
                    <div className={styles.infoRow}>
                      <p className={styles.infoLabel}>Basic Monthly Salary</p>
                      <p className={styles.salaryValue}>{salary}</p>
                    </div>
                  )}

                  <div className={styles.datesGrid}>
                    <div className={styles.infoRow}>
                      <p className={styles.infoLabel}>Sign-On</p>
                      <p className={styles.infoValue}>{fmt(ship.sign_on_date)}</p>
                    </div>
                    <div className={styles.infoRow}>
                      <p className={styles.infoLabel}>Sign-Off</p>
                      {isOnBoard ? (
                        <p className={styles.onBoardInline}>
                          <span className={styles.onBoardDotSmall} /> Present
                        </p>
                      ) : (
                        <p className={styles.infoValue}>{fmt(ship.sign_off_date)}</p>
                      )}
                    </div>
                  </div>
                  {days !== null && (
                    <div className={styles.daysBox}>
                      <span>{isOnBoard ? "Days So Far" : "Days on Board"}</span>
                      <strong>{days}</strong>
                    </div>
                  )}
                  <div className={styles.infoRow}>
                    <p className={styles.infoLabel}>Assigned Rank</p>
                    <p className={styles.rankValue}>
                      <span className="msi msi-sm" style={{ verticalAlign: "middle", color: "var(--primary)" }}>anchor</span> {ship.rank_onboard}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className={styles.rightCol}>
              {/* Personnel */}
              {personnel.length > 0 && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}><span className={styles.cardIcon}>👥</span> Personells Sailed With </h3>
                  <div className={styles.personnelGrid}>
                    {personnel.map((p, i) => (
                      <div key={i} className={styles.personnelCard}>
                        <div className={styles.personnelAvatar}>
                          <span className="msi msi-md" style={{ color: "var(--on-surface-variant)" }}>person</span>
                        </div>
                        <div>
                          <p className={styles.personnelRole}>{p.role}</p>
                          <p className={styles.personnelName}>{p.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Particulars */}
              {(ship.main_engine_type || ship.aux_engine_type || ship.aux_boiler_type) && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}><span className={styles.cardIcon}>⚙</span> Technical Particulars</h3>
                  <div className={styles.techGrid}>
                    <div className={styles.techSection}>
                      <p className={styles.techSectionTitle}>Propulsion & Engine</p>
                      {ship.main_engine_type && <div className={styles.techRow}><span>Main Engine</span><span>{ship.main_engine_type}</span></div>}
                      {ship.main_engine_details && <div className={styles.techRow}><span>MCR Output</span><span>{ship.main_engine_details}</span></div>}
                      {ship.aux_engine_type && <div className={styles.techRow}><span>Aux Engines</span><span>{ship.aux_engine_type}</span></div>}
                      {ship.aux_engine_details && <div className={styles.techRow}><span>Aux Details</span><span>{ship.aux_engine_details}</span></div>}
                    </div>
                    {(ship.aux_boiler_type || ship.aux_boiler_details) && (
                      <div className={styles.techSection}>
                        <p className={styles.techSectionTitle}>Boilers & Auxiliaries</p>
                        {ship.aux_boiler_type && <div className={styles.techRow}><span>Boiler</span><span>{ship.aux_boiler_type}</span></div>}
                        {ship.aux_boiler_details && <div className={styles.techRow}><span>Details</span><span>{ship.aux_boiler_details}</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notes — full width */}
            {ship.notes && (
              <div className={`${styles.card} ${styles.fullWidth}`}>
                <h3 className={styles.cardTitle}><span className={styles.cardIcon}>📝</span> Voyage & Performance Notes</h3>
                <div className={styles.notesBox}>
                  <p>{ship.notes}</p>
                </div>
              </div>
            )}

            {/* Documentations — full width */}
            {documents.length > 0 && (
              <div className={`${styles.card} ${styles.fullWidth}`}>
                <h3 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>
                    <span className="msi msi-sm" style={{ color: "var(--primary)" }}>folder</span>
                  </span> Documentations
                  <span className={styles.cardTitleSub}> — Contract, Ship Particulars, Appraisals and testimonials </span>
                </h3>
                <div className={styles.docsGrid}>
                  {documents.map((d, i) => (
                    d.kind === "pdf" ? (
                      <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className={styles.docCard}>
                        <div className={styles.docIconBox} data-kind="pdf">
                          <span className="msi msi-sm" style={{ color: "var(--primary)" }}>description</span>
                        </div>
                        <div className={styles.docInfo}>
                          <p className={styles.docTitle}>{d.title}</p>
                          <p className={styles.docMeta}>PDF Document{d.size_label ? ` · ${d.size_label}` : ""}</p>
                        </div>
                        <span className={styles.docArrow}>↗</span>
                      </a>
                    ) : (
                      <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className={styles.docCard}>
                        <div className={styles.docIconBox} data-kind="link">
                          <span className="msi msi-sm" style={{ color: "rgb(251,146,60)" }}>link</span>
                        </div>
                        <div className={styles.docInfo}>
                          <p className={styles.docTitle}>{d.title}</p>
                          <p className={styles.docMeta}>{d.url}</p>
                        </div>
                        <span className={styles.docArrow}>↗</span>
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Bar at bottom */}
          <div className={styles.fixedBottomBar}>
            <DeleteShipButton shipId={ship.id} vesselName={ship.vessel_name} userId={user.id} />
            <Link href={`/sailing-history/${id}/edit`} className={styles.editBtnFixed}>
              <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>edit</span> Edit Entry
            </Link>
          </div>
        </main>
      </div>
    </AppShellServer>
  );
}
