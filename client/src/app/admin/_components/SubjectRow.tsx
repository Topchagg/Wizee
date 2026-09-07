import styles from "../page.module.css";
import { AddChildForm } from "./AddChildForm";
import { ThemeRow } from "./ThemeRow";
import type { TreeActions, TreeSubject } from "./types";

export function SubjectRow({ subject, actions }: { subject: TreeSubject; actions: TreeActions }) {
  const open = actions.expandedSubjects.has(subject.id);

  return (
    <div className={styles.subjectBlock}>
      <div className={styles.rowShell}>
        <button type="button" className={styles.subjectRow} onClick={() => actions.onToggleSubject(subject.id)}>
          <span className={open ? styles.chevronOpen : styles.chevron}>▸</span>
          <span className={styles.subjectTitle}>{subject.title}</span>
          <span className="badge">
            {subject.themes.length} {subject.themes.length === 1 ? "theme" : "themes"}
          </span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.onDeleteSubject(subject)}>
          Delete
        </button>
      </div>

      {open && (
        <div className={styles.nested}>
          <AddChildForm placeholder="New Theme title" onSubmit={(title) => actions.onCreateTheme(subject.id, title)} />
          {subject.themes.map((theme) => (
            <ThemeRow key={theme.id} theme={theme} actions={actions} />
          ))}
        </div>
      )}
    </div>
  );
}
