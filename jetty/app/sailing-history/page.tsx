import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import DeleteShipButton from "@/app/components/sailing/DeleteShipButton";
import styles from "./page.module.css";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function calcDays(sign_on: string | null, sign_off: string | null, today: Date): number | null {
  if (!sign_on) return null;
  const to = sign_off ? new Date(sign_off) : today;
  return Math.max(0, Math.round((to.getTime() - new Date(sign_on).getTime()) / 86_400_000));
}

function formatSeaTime(totalDays: number): string {
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);
  const days = totalDays % 30;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (days > 0 || parts.length === 0) parts.push(`${days}d`);
  return parts.join(" ");
}

export default async function SailingHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ships } = await supabase
    .from("sailing_history")
    .select("id, vessel_name, imo_number, vessel_type, rank_onboard, company, sign_on_date, sign_off_date, vessel_image_url")
    .order("sign_on_date", { ascending: false });

  const today = new Date();

  // Total sea time includes active voyage days (from sign_on to today)
  const totalDays = ships?.reduce((sum, s) => {
    const d = calcDays(s.sign_on_date, s.sign_off_date, today);
    return sum + (d ?? 0);
  }, 0) ?? 0;

  // Vessels SAILED = only those with a sign_off_date (completed voyages)
  const sailedCount = ships?.filter(s => !!s.sign_off_date).length ?? 0;
  const onBoardCount = ships?.filter(s => !!s.sign_on_date && !s.sign_off_date).length ?? 0;

  return (
    <AppShellServer>
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <div>
              <span className={styles.breadcrumb}>Voyage Records</span>
              <h1 className={styles.title}>Sailing History</h1>
              {(sailedCount > 0 || onBoardCount > 0) ? (
                <div className={styles.statsRow}>
                  <span className={styles.statChip}>
                    <span className="msi msi-sm" style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: "4px" }}>directions_boat</span>
                    <strong>{sailedCount}</strong> {sailedCount === 1 ? "Vessel" : "Vessels"} Sailed
                  </span>
                  {onBoardCount > 0 && (
                    <>
                      <span className={styles.statDivider}>·</span>
                      <span className={styles.statChipOnBoard}>
                        <span className={styles.onBoardDot} /> Currently On Board
                      </span>
                    </>
                  )}
                  <span className={styles.statDivider}>·</span>
                  <span className={styles.statChip}>
                    <span className="msi msi-sm" style={{ color: "var(--primary)", verticalAlign: "middle", marginRight: "4px" }}>calendar_month</span>
                    Sea Time: <strong>{formatSeaTime(totalDays)}</strong>
                    <span className={styles.statSub}>({totalDays.toLocaleString()} days)</span>
                  </span>
                </div>
              ) : (
                <p className={styles.subtitle}>No vessels added yet</p>
              )}
            </div>
            <Link href="/sailing-history/new" className={styles.addBtnDesktop}>
              <span className="msi msi-sm">add</span> Add New Vessel
            </Link>
          </div>

          {(!ships || ships.length === 0) ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <span className="msi" style={{ fontSize: "3rem", color: "var(--outline)", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>anchor</span>
              </div>
              <h2 className={styles.emptyTitle}>No Vessels Yet</h2>
              <p className={styles.emptyText}>Start building your professional sailing record.</p>
              <Link href="/sailing-history/new" className={styles.emptyBtn}>Add Your First Vessel</Link>
            </div>
          ) : (
            <div className={styles.shipGrid}>
              {ships.map(ship => {
                const isOnBoard = !!ship.sign_on_date && !ship.sign_off_date;
                const days = calcDays(ship.sign_on_date, ship.sign_off_date, today);
                return (
                  <Link href={`/sailing-history/${ship.id}`} key={ship.id} className={styles.shipCard}>
                    <div className={styles.cardImageWrapper}>
                      {ship.vessel_image_url ? (
                        <Image src={ship.vessel_image_url} alt={ship.vessel_name} fill style={{ objectFit: "cover" }} unoptimized />
                      ) : (
                        <div className={styles.cardImagePlaceholder}>
                          <span className="msi" style={{ fontSize: "2.5rem", color: "var(--outline)", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>directions_boat</span>
                        </div>
                      )}
                      <div className={styles.cardImageOverlay} />
                      <span className={styles.rankBadge}>{ship.rank_onboard}</span>
                      {isOnBoard && (
                        <span className={styles.onBoardBadge}>
                          <span className={styles.onBoardDot} />
                          On Board
                        </span>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.shipName}>{ship.vessel_name}</h3>
                      {ship.imo_number && <p className={styles.imoLabel}>IMO {ship.imo_number}</p>}
                      <div className={styles.cardMeta}>
                        <span>{ship.vessel_type || "—"}</span>
                        <span>·</span>
                        <span>{ship.company || "—"}</span>
                      </div>
                      <div className={styles.cardDates}>
                        <span>{formatDate(ship.sign_on_date)}</span>
                        <span className={styles.dateSep}>
                          <span className="msi msi-sm" style={{ color: "var(--outline)", verticalAlign: "middle" }}>arrow_forward</span>
                        </span>
                        <span>{isOnBoard
                          ? <span style={{ color: "#4ade80", fontWeight: 600 }}>Present</span>
                          : formatDate(ship.sign_off_date)}
                        </span>
                        {days !== null && (
                          <span className={isOnBoard ? styles.daysBadgeActive : styles.daysBadge}>
                            {days}d
                          </span>
                        )}
                        <div style={{ marginLeft: days === null ? "auto" : "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255, 75, 75, 0.1)", borderRadius: "50%", width: "1.75rem", height: "1.75rem", color: "#ffb4ab", transition: "background 0.2s" }}>
                          <DeleteShipButton shipId={ship.id} vesselName={ship.vessel_name} userId={user.id} variant="icon" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        {/* Floating Add button for mobile */}
        <div className={styles.fixedBottomBar}>
          <Link href="/sailing-history/new" className={styles.addBtnFixed}>
            <span className="msi msi-sm">add</span> Add New Vessel
          </Link>
        </div>
      </div>
    </AppShellServer>
  );
}
