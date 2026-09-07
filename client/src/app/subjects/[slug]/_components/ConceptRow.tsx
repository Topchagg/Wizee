import styles from "../page.module.css";
import { SubConceptList } from "./SubConceptList";
import type { TreeConcept } from "./types";

export function ConceptRow({
  concept,
  open,
  onToggle,
  onSuggest,
}: {
  concept: TreeConcept;
  open: boolean;
  onToggle: () => void;
  onSuggest: () => void;
}) {
  return (
    <div className={styles.conceptBlock}>
      <div className={styles.rowShell}>
        <button type="button" className={styles.conceptRow} onClick={onToggle}>
          <span className={open ? styles.chevronOpen : styles.chevron}>▸</span>
          <span className={styles.conceptTitle}>{concept.title}</span>
          <span className="badge">{concept.subConcepts.length} sub-concepts</span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onSuggest}>
          + Suggest
        </button>
      </div>

      {open && <SubConceptList subConcepts={concept.subConcepts} />}
    </div>
  );
}
