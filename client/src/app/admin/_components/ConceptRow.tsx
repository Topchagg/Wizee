import styles from "../page.module.css";
import { AddChildForm } from "./AddChildForm";
import { SubConceptRow } from "./SubConceptRow";
import type { TreeActions, TreeConcept } from "./types";

export function ConceptRow({ concept, actions }: { concept: TreeConcept; actions: TreeActions }) {
  const open = actions.expandedConcepts.has(concept.id);

  return (
    <div className={styles.conceptBlock}>
      <div className={styles.rowShell}>
        <button type="button" className={styles.conceptRow} onClick={() => actions.onToggleConcept(concept.id)}>
          <span className={open ? styles.chevronOpen : styles.chevron}>▸</span>
          <span className={styles.conceptTitle}>{concept.title}</span>
          <span className="badge">{concept.subConcepts.length} sub-concepts</span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.onOpenPrereqs(concept.id, concept.title)}>
          Prereqs
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.onDeleteConcept(concept)}>
          Delete
        </button>
      </div>

      {open && (
        <div className={styles.nested}>
          <AddChildForm placeholder="New Sub-concept title" onSubmit={(title) => actions.onCreateSubConcept(concept.id, title)} />
          {concept.subConcepts.length === 0 ? (
            <p className={styles.emptyHint}>No Sub-concepts yet.</p>
          ) : (
            <ul className={styles.subConceptList}>
              {concept.subConcepts.map((sc) => (
                <SubConceptRow key={sc.id} sc={sc} actions={actions} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
