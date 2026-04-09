"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./AppShell.module.css";

// -- Nav items — Material Symbols Rounded icons matching Stitch design ---------
const NAV_ITEMS = [
  { icon: "dashboard",         label: "Home",               href: "/",                ready: true  },
  { icon: "directions_boat",   label: "Sailing History",    href: "/sailing-history", ready: true  },
  { icon: "description",       label: "Documents",          href: "/documents",       ready: true  },
  { icon: "quiz",              label: "Exams",              href: "/exams",           ready: false },
  { icon: "shopping_cart",     label: "Shop",               href: "/shop",            ready: false },
  { icon: "business_center",   label: "Jobs",               href: "/jobs",            ready: false },
  { icon: "policy",            label: "DG Shipping",        href: "/dg-shipping",     ready: true  },
  { icon: "menu_book",         label: "Manuals",            href: "/manuals",         ready: false },
  { icon: "currency_exchange", label: "Currency Converter", href: "/currency",        ready: false },
  { icon: "calculate",         label: "Sea Time Calculator",href: "/seatime",         ready: true  },
];

// -- Profile prop passed down from Server Component ----------------------------
export interface ShellProfile {
  avatar_url: string | null;
  full_name: string | null;
  rank: string | null;
}

interface Props {
  user: { id: string; email?: string } | null;
  profile: ShellProfile | null;
  children: React.ReactNode;
}

export default function AppShell({ user, profile, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const avatarUrl = profile?.avatar_url ?? null;
  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "Seafarer";
  const displayRank = profile?.rank ?? null;

  return (
    <div className={styles.root}>
      {/* -- Top App Bar --------------------------------------------------- */}
      <header className={styles.appBar}>
        {/* Left: Hamburger */}
        <button
          id="drawer-toggle"
          className={styles.iconBtn}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
        >
          <span className="msi msi-md" style={{ color: "var(--on-surface-variant)" }}>menu</span>
        </button>

        {/* Center: App name */}
        <Link href="/" className={styles.appName}>JETTY</Link>

        {/* Right: Avatar or Login */}
        {user ? (
          <div className={styles.userMenuWrapper} ref={userMenuRef}>
            <button
              id="user-menu-btn"
              className={styles.avatarBtn}
              onClick={() => setUserMenuOpen(v => !v)}
              aria-label="User menu"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className={styles.avatarImg}
                  unoptimized
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            {userMenuOpen && (
              <div className={styles.userMenu} role="menu">
                <Link
                  href="/profile"
                  className={styles.userMenuItem}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <span className="msi msi-sm">person</span> Profile Settings
                </Link>
                <button className={styles.userMenuItemBtn} onClick={handleLogout}>
                  <span className="msi msi-sm">logout</span> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={styles.loginBtn}>Log In</Link>
        )}
      </header>

      {/* -- Drawer Overlay ------------------------------------------------- */}
      {drawerOpen && (
        <div
          className={styles.overlay}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* -- Side Drawer ---------------------------------------------------- */}
      <nav className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`} aria-label="Main navigation">
        {/* Close */}
        <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)} aria-label="Close menu">
          <span className="msi msi-sm">close</span>
        </button>

        {/* -- Profile section ------------------------------------------------ */}
        <Link
          href={user ? "/profile" : "/login"}
          className={styles.drawerProfile}
          onClick={() => setDrawerOpen(false)}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={64}
              height={64}
              className={styles.drawerAvatar}
              unoptimized
            />
          ) : (
            <div className={styles.drawerAvatarFallback}>
              {user ? displayName.charAt(0).toUpperCase() : "?"}
            </div>
          )}
          <div className={styles.drawerProfileInfo}>
            {user ? (
              <>
                <p className={styles.drawerName}>{displayName}</p>
                {displayRank
                  ? <p className={styles.drawerRank}>{displayRank}</p>
                  : <span className={styles.completeProfileBtn} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>Complete Profile <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>arrow_forward</span></span>
                }
              </>
            ) : (
              <>
                <p className={styles.drawerName}>Guest</p>
                <span className={styles.completeProfileBtn} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>Log In <span className="msi msi-sm" style={{ verticalAlign: "middle" }}>arrow_forward</span></span>
              </>
            )}
          </div>
        </Link>

        <div className={styles.drawerDivider} />

        {/* Nav items */}
        <ul className={styles.drawerNav}>
          {NAV_ITEMS.map(({ icon, label, href, ready }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <li key={label}>
                {ready ? (
                  <Link
                    href={href}
                    className={`${styles.drawerNavItem} ${isActive ? styles.drawerNavItemActive : ""}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className={`msi msi-md ${styles.navIcon}`}>{icon}</span>
                    <span className={styles.navLabel}>{label}</span>
                    {isActive && <span className={styles.navActiveDot} />}
                  </Link>
                ) : (
                  <span className={`${styles.drawerNavItem} ${styles.drawerNavItemDisabled}`}>
                    <span className={`msi msi-md ${styles.navIcon}`} style={{ opacity: 0.5 }}>{icon}</span>
                    <span className={styles.navLabel}>{label}</span>
                    <span className={styles.navSoon}>Soon</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div className={styles.drawerFooter}>
          <p className={styles.drawerFooterText}>Jetty · Mariner&apos;s Life App</p>
          <p className={styles.drawerFooterSub}>v1.0.0</p>
        </div>
      </nav>

      {/* -- Page Content --------------------------------------------------- */}
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}
