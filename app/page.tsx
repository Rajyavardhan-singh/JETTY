import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "./components/AppShellServer";
import CurrencyWidget from "./components/CurrencyWidget";
import styles from "./page.module.css";

// ── Quick access modules — icons match Stitch design (Material Symbols) ──────
const MODULES = [
  { icon: "directions_boat", title: "Sailing History", sub: "Manage past voyages", href: "/sailing-history", ready: true },
  { icon: "description", title: "Documents", sub: "Certificates & Licences", href: "/documents", ready: true },
  { icon: "quiz", title: "Exams", sub: "Preparation & Results", href: "/exams", ready: false },
  { icon: "shopping_cart", title: "Shop", sub: "Maritime Gear & Tools", href: "/shop", ready: false },
  { icon: "business_center", title: "Jobs", sub: "Crewing Opportunities", href: "/jobs", ready: false },
  { icon: "policy", title: "DG Shipping", sub: "Compliance & Profile", href: "/dg-shipping", ready: true },
  { icon: "menu_book", title: "Manuals", sub: "Technical References", href: "/manuals", ready: false },
  { icon: "currency_exchange", title: "Currency Converter", sub: "Live Exchange Rates", href: "/currency", ready: false },
  { icon: "calculate", title: "Sea Time Calculator", sub: "Calculate Your Sea Service", href: "/seatime", ready: true },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name: string | null; rank: string | null; avatar_url: string | null } | null = null;
  let sailingStats: { sailedCount: number; totalDays: number; isOnBoard: boolean } | null = null;

  if (user) {
    const { data: p } = await supabase
      .from("seafarer_profiles")
      .select("full_name, rank, avatar_url")
      .eq("id", user.id)
      .single();
    profile = p;

    const { data: ships } = await supabase
      .from("sailing_history")
      .select("sign_on_date, sign_off_date");

    if (ships) {
      const today = new Date();
      let totalDays = 0;
      let hasActiveVoyage = false;

      for (const s of ships) {
        if (!s.sign_on_date) continue;
        if (!s.sign_off_date) {
          hasActiveVoyage = true;
          totalDays += Math.max(0, Math.round(
            (today.getTime() - new Date(s.sign_on_date).getTime()) / 86_400_000
          ));
        } else {
          totalDays += Math.max(0, Math.round(
            (new Date(s.sign_off_date).getTime() - new Date(s.sign_on_date).getTime()) / 86_400_000
          ));
        }
      }

      const sailedCount = ships.filter(s => !!s.sign_off_date).length;
      sailingStats = { sailedCount, totalDays, isOnBoard: hasActiveVoyage };
    }
  }

  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? null;
  const rank = profile?.rank ?? null;

  return (
    <AppShellServer>
      <div className={styles.page}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />

          {user ? (
            <>
              {/* Left: avatar + name */}
              <div className={styles.heroContent}>
                {/* {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName ?? ""}
                    width={72}
                    height={72}
                    className={styles.heroAvatar}
                    unoptimized
                  />
                ) : (
                  <div className={styles.heroAvatarFallback}>
                    {displayName ? displayName.charAt(0).toUpperCase() : "S"}
                  </div>
                )} */}
                <div className={styles.heroText}>
                  <p className={styles.heroGreeting}>Welcome back,</p>
                  <h1 className={styles.heroName}>{displayName ?? "Seafarer"}</h1>
                  {rank && <p className={styles.heroRank}>{rank}</p>}
                  {!profile?.full_name && (
                    <Link href="/profile" className={styles.heroCompleteBtn}>
                      Complete profile <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>arrow_forward</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: status badge + currency widget */}
              <div className={styles.heroRight}>
                {sailingStats !== null && (
                  sailingStats.isOnBoard ? (
                    <div className={styles.statusOnBoard}>
                      <span className={styles.statusDot} />
                      <span>On Board</span>
                    </div>
                  ) : (
                    <div className={styles.statusAshore}>
                      <span className={styles.asDot} />
                      <span>Ashore</span>
                    </div>
                  )
                )}
                <CurrencyWidget />
              </div>
            </>
          ) : (
            <div className={styles.heroContent}>
              <div className={styles.heroLogo}>
                <span className="msi" style={{ fontSize: "3rem", color: "var(--primary)", fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>anchor</span>
              </div>
              <div className={styles.heroText}>
                <h1 className={styles.heroNameGuest}>JETTY</h1>
                <p className={styles.heroGreeting}>Your maritime companion — built for seafarers.</p>
                <div className={styles.heroGuestBtns}>
                  <Link href="/login" className={styles.heroBtnPrimary}>Log In</Link>
                  <Link href="/signup" className={styles.heroBtnSecondary}>Create Account</Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Sea-time stats bar ───────────────────────────────────────── */}
        {sailingStats && (sailingStats.sailedCount > 0 || sailingStats.totalDays > 0) && (
          <section className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{sailingStats.sailedCount}</span>
              <span className={styles.statLabel}>Vessels Sailed</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{sailingStats.totalDays.toLocaleString()}</span>
              <span className={styles.statLabel}>Days at Sea</span>
            </div>
            {sailingStats.isOnBoard && (
              <>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statValue} style={{ color: "#4ade80" }}>1</span>
                  <span className={styles.statLabel}>Active Voyage</span>
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Navigation modules ───────────────────────────────────────── */}
        <section className={styles.modulesSection}>
          <h2 className={styles.sectionTitle}>Navigation</h2>
          <div className={styles.modulesGrid}>
            {MODULES.map(({ icon, title, sub, href, ready }) =>
              ready ? (
                <Link key={title} href={href} className={styles.moduleCard}>
                  <div className={styles.moduleIcon}>
                    <span className="msi msi-lg" style={{ color: "var(--on-primary-container)" }}>{icon}</span>
                  </div>
                  <div className={styles.moduleInfo}>
                    <p className={styles.moduleTitle}>{title}</p>
                    <p className={styles.moduleSub}>{sub}</p>
                  </div>
                  <span className={styles.moduleArrow}>
                    <span className="msi msi-sm" style={{ color: "var(--primary)", opacity: 0.7 }}>chevron_right</span>
                  </span>
                </Link>
              ) : (
                <div key={title} className={`${styles.moduleCard} ${styles.moduleCardDisabled}`}>
                  <div className={styles.moduleIcon}>
                    <span className="msi msi-lg" style={{ color: "var(--outline)" }}>{icon}</span>
                  </div>
                  <div className={styles.moduleInfo}>
                    <p className={styles.moduleTitle}>{title}</p>
                    <p className={styles.moduleSub}>{sub}</p>
                  </div>
                  <span className={styles.moduleSoon}>Soon</span>
                </div>
              )
            )}
          </div>
        </section>

      </div>
    </AppShellServer>
  );
}
