import Link from "next/link";
import styles from "../page.module.css";
import type { TreeSubConcept } from "./types";

export function SubConceptList({ subConcepts }: { subConcepts: TreeSubConcept[] }) {
  return (
    <ul className={styles.subConceptList}>
      {subConcepts.map((subConcept) =>
        subConcept.contentCount > 0 && subConcept.primaryContentId ? (
          <li key={subConcept.id}>
            <Link href={`/learn/${subConcept.slug}/${subConcept.primaryContentId}`} className={styles.subConceptRow}>
              <span className={styles.dot} />
              <span className={styles.subConceptTitle}>{subConcept.title}</span>
              <span className="badge badge-success">
                {subConcept.contentCount} {subConcept.contentCount === 1 ? "video" : "videos"}
              </span>
            </Link>
          </li>
        ) : (
          <li key={subConcept.id} className={styles.subConceptRowEmpty}>
            <span className={styles.dotEmpty} />
            <span className={styles.subConceptTitle}>{subConcept.title}</span>
            <Link href="/add-content" className={styles.addContentLink}>
              + Add content
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}
