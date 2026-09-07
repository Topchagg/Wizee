import styles from "../page.module.css";
import { AddChildForm } from "./AddChildForm";
import { ConceptRow } from "./ConceptRow";
import type { TreeActions, TreeTheme } from "./types";

export function ThemeRow({ theme, actions }: { theme: TreeTheme; actions: TreeActions }) {
  const open = actions.expandedThemes.has(theme.id);

  return (
    <div className={styles.themeBlock}>
      <div className={styles.rowShell}>
        <button type="button" className={styles.themeRow} onClick={() => actions.onToggleTheme(theme.id)}>
          <span className={open ? styles.chevronOpen : styles.chevron}>▸</span>
          <span className={styles.themeTitle}>{theme.title}</span>
          <span className="badge">
            {theme.concepts.length} {theme.concepts.length === 1 ? "concept" : "concepts"}
          </span>
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => actions.onDeleteTheme(theme)}>
          Delete
        </button>
      </div>

      {open && (
        <div className={styles.nested}>
          <AddChildForm placeholder="New Concept title" onSubmit={(title) => actions.onCreateConcept(theme.id, title)} />
          {theme.concepts.map((concept) => (
            <ConceptRow key={concept.id} concept={concept} actions={actions} />
          ))}
        </div>
      )}
    </div>
  );
}
