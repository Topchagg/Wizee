import Link from "next/link";
import styles from "../page.module.css";
import type { BuildsOnEntry } from "./types";

export function Breadcrumb({
  breadcrumb,
  buildsOn,
}: {
  breadcrumb: { subject: string; theme: string; concept: string };
  buildsOn: BuildsOnEntry[];
}) {
  return (
    <>
      <div className={styles.breadcrumb}>
        <span>{breadcrumb.subject}</span>
        <span className={styles.crumbSep}>/</span>
        <span>{breadcrumb.theme}</span>
        <span className={styles.crumbSep}>/</span>
        <span>{breadcrumb.concept}</span>
      </div>
      {buildsOn.length > 0 && (
        // Light, non-blocking note — never a hard gate (readme: the
        // platform surfaces information, it doesn't withhold access).
        <p className={styles.buildsOn}>
          Builds on:{" "}
          {buildsOn.map((b, i) => (
            <span key={b.id}>
              {i > 0 && ", "}
              <Link href={`/learn/${b.slug}/${b.contentId}`} className={styles.buildsOnLink}>
                {b.title}
              </Link>
            </span>
          ))}
        </p>
      )}
    </>
  );
}
