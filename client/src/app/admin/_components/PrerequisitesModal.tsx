import { Modal } from "@/components/Modal";
import styles from "../page.module.css";
import type { FlatConcept, PrereqConcept } from "./types";

export function PrerequisitesModal({
  conceptTitle,
  prereqList,
  candidates,
  query,
  onQueryChange,
  busyId,
  error,
  onAdd,
  onRemove,
  onClose,
}: {
  conceptTitle: string;
  prereqList: PrereqConcept[] | null;
  candidates: FlatConcept[];
  query: string;
  onQueryChange: (query: string) => void;
  busyId: string | null;
  error: string | null;
  onAdd: (conceptId: string) => void;
  onRemove: (conceptId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={`Prerequisites for "${conceptTitle}"`}
      onClose={onClose}
      actions={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <p className={styles.prereqHint}>
        Concepts a learner should already know before this one — may live in any Theme, including a different one.
      </p>

      {prereqList === null ? (
        <p className="text-secondary">Loading…</p>
      ) : prereqList.length === 0 ? (
        <p className="text-secondary">No prerequisites set yet.</p>
      ) : (
        <ul className={styles.prereqList}>
          {prereqList.map((p) => (
            <li key={p.id} className={styles.prereqRow}>
              <span className={styles.prereqTitle}>{p.title}</span>
              <span className={styles.prereqTheme}>{p.themeTitle}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onRemove(p.id)} disabled={busyId === p.id}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        className={`input ${styles.prereqSearchInput}`}
        placeholder="Search Concepts to add as a prerequisite…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {candidates.length > 0 && (
        <ul className={styles.prereqList}>
          {candidates.map((c) => (
            <li key={c.id} className={styles.prereqRow}>
              <span className={styles.prereqTitle}>{c.title}</span>
              <span className={styles.prereqTheme}>
                {c.subjectTitle} → {c.themeTitle}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAdd(c.id)} disabled={busyId === c.id}>
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className={`text-danger ${styles.prereqError}`}>{error}</p>}
    </Modal>
  );
}
