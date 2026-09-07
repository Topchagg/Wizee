import { Modal } from "@/components/Modal";
import styles from "../page.module.css";
import type { MissingPrerequisite } from "./types";

export function PrereqSuggestionModal({
  suggestions,
  busy,
  onAdd,
  onClose,
}: {
  suggestions: MissingPrerequisite[];
  busy: boolean;
  onAdd: (conceptId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Add its prerequisites too?"
      onClose={onClose}
      actions={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Not now
        </button>
      }
    >
      <p className={styles.prereqHint}>
        This Concept depends on the following — not required, but a learner following this path may need them too.
      </p>
      <ul className={styles.prereqList}>
        {suggestions.map((p) => (
          <li key={p.id} className={styles.prereqRow}>
            <span className={styles.prereqTitle}>{p.title}</span>
            <span className={styles.prereqTheme}>{p.themeTitle}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAdd(p.id)} disabled={busy}>
              Add
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
