"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { canCreate, useAuth } from "@/contexts/AuthContext";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { href: "/subjects", label: "Subjects" },
  { href: "/choose-path", label: "Choose a Path" },
  { href: "/chat", label: "Chat" },
  // Tree curation — SUPERADMIN only, matching the server's RolesGuard on /admin/*.
  { href: "/admin", label: "Admin", superAdminOnly: true },
];

// Account-scoped links tucked behind the avatar menu instead of the main
// nav — same visibility rules as before (My Paths/Add Content need TUTOR),
// just relocated.
const MENU_LINKS = [
  { href: "/progress", label: "Progress" },
  { href: "/my-paths", label: "My Paths", tutorOnly: true },
  { href: "/add-content", label: "Add Content", tutorOnly: true },
];

export function Header() {
  const { user, loading, appUser, signOut } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = (user?.displayName ?? user?.email ?? "?").trim().charAt(0).toUpperCase();
  const navLinks = NAV_LINKS.filter((link) => !link.superAdminOnly || appUser?.role === "SUPERADMIN");
  const menuLinks = MENU_LINKS.filter((link) => !link.tutorOnly || canCreate(appUser?.role));

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Closing on navigation — otherwise the menu stays open over the new page.
  useEffect(() => {
    void Promise.resolve().then(() => setMenuOpen(false));
  }, [pathname]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>W</span>
          Wizee
        </Link>

        {user && (
          <nav className={styles.nav}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname?.startsWith(link.href) ? styles.navLinkActive : styles.navLink}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className={styles.actions}>
          {loading ? null : user ? (
            <div className={styles.menuWrapper} ref={menuRef}>
              <button
                type="button"
                className={styles.avatar}
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                title={user.displayName ?? user.email ?? undefined}
              >
                {initials}
              </button>
              {menuOpen && (
                <div className={styles.menu} role="menu">
                  {menuLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={styles.menuLink}
                      role="menuitem"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    className={styles.menuLink}
                    role="menuitem"
                    onClick={() => void signOut()}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
