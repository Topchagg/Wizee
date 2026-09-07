import Link from "next/link";
import styles from "../page.module.css";
import type { SiblingSubConcept } from "./types";

export function SiblingsCard({
  conceptTitle,
  siblings,
  currentSlug,
}: {
  conceptTitle: string;
  siblings: SiblingSubConcept[];
  currentSlug: string;
}) {
  return (
    <div className={`card ${styles.siblingCard}`}>
      <h2 className={styles.siblingHeading}>{conceptTitle}</h2>
      <p className={styles.siblingSubheading}>Sub-concepts in this Concept</p>
      <ol className={styles.siblingList}>
        {siblings.map((sib, idx) => {
          const isCurrent = sib.slug === currentSlug;
          const rowClass = isCurrent ? styles.siblingRowActive : sib.contentId ? styles.siblingRow : styles.siblingRowEmpty;
          const rowContent = (
            <>
              <span className={styles.siblingDot}>{isCurrent ? "●" : idx + 1}</span>
              <span className={styles.siblingTitle}>{sib.title}</span>
            </>
          );
          return (
            <li key={sib.id}>
              {sib.contentId && !isCurrent ? (
                <Link href={`/learn/${sib.slug}/${sib.contentId}`} className={rowClass}>
                  {rowContent}
                </Link>
              ) : (
                <span className={rowClass}>{rowContent}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
