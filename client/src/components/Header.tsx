"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./Header.module.css";

const NAV_LINKS = [
  { href: "/subjects", label: "Subjects" },
  { href: "/choose-path", label: "Choose a Path" },
  { href: "/my-paths", label: "My Paths" },
  { href: "/progress", label: "Progress" },
  { href: "/add-content", label: "Add Content" },
  { href: "/chat", label: "Chat" },
];

export function Header() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  const initials = (user?.displayName ?? user?.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark}>W</span>
          Wizee
        </Link>

        {user && (
          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => (
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
            <>
              <span className={styles.avatar} title={user.displayName ?? user.email ?? undefined}>
                {initials}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
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
