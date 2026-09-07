import styles from "../page.module.css";
import type { TreeActions, TreeSubConcept } from "./types";

export function SubConceptRow({ sc, actions }: { sc: TreeSubConcept; actions: TreeActions }) {
  return (
    <li className={styles.subConceptRow}>
      <span className={styles.dot} />
      <span className={styles.subConceptTitle}>{sc.title}</span>
      <span className={styles.subConceptSlug}>{sc.slug}</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.onDeleteSubConcept(sc)}>
        Delete
      </button>
    </li>
  );
}
