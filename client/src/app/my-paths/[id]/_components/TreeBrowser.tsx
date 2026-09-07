import styles from "../page.module.css";
import { toggleSetMember } from "@/lib/set-utils";
import type { AddItem, TreeTheme } from "./types";

export function TreeBrowser({
  themes,
  expandedThemes,
  onExpandedThemesChange,
  expandedConcepts,
  onExpandedConceptsChange,
  addedThemeIds,
  addedConceptIds,
  busy,
  onAdd,
}: {
  themes: TreeTheme[];
  expandedThemes: Set<string>;
  onExpandedThemesChange: (next: Set<string>) => void;
  expandedConcepts: Set<string>;
  onExpandedConceptsChange: (next: Set<string>) => void;
  addedThemeIds: Set<string | null>;
  addedConceptIds: Set<string | null>;
  busy: boolean;
  onAdd: AddItem;
}) {
  return (
    <div className={styles.tree}>
      {themes.map((theme) => {
        const themeOpen = expandedThemes.has(theme.id);
        return (
          <div key={theme.id} className={styles.themeBlock}>
            <div className={styles.themeRow}>
              <button
                type="button"
                className={styles.themeToggle}
                onClick={() => onExpandedThemesChange(toggleSetMember(expandedThemes, theme.id))}
              >
                <span className={themeOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                <span className={styles.themeTitle}>{theme.title}</span>
                <span className="badge">
                  {theme.concepts.length} {theme.concepts.length === 1 ? "concept" : "concepts"}
                </span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onAdd("THEME", theme.id)}
                disabled={busy || addedThemeIds.has(theme.id)}
              >
                {addedThemeIds.has(theme.id) ? "Added ✓" : "Add whole Theme"}
              </button>
            </div>

            {themeOpen && (
              <div className={styles.concepts}>
                {theme.concepts.map((concept) => {
                  const conceptOpen = expandedConcepts.has(concept.id);
                  return (
                    <div key={concept.id} className={styles.conceptBlock}>
                      <div className={styles.conceptRow}>
                        <button
                          type="button"
                          className={styles.conceptToggle}
                          onClick={() => onExpandedConceptsChange(toggleSetMember(expandedConcepts, concept.id))}
                        >
                          <span className={conceptOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                          <span className={styles.conceptTitle}>{concept.title}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onAdd("CONCEPT", undefined, concept.id)}
                          disabled={busy || addedConceptIds.has(concept.id)}
                        >
                          {addedConceptIds.has(concept.id) ? "Added ✓" : "Add"}
                        </button>
                      </div>

                      {conceptOpen && (
                        <ul className={styles.subConceptList}>
                          {concept.subConcepts.map((subConcept) => (
                            <li key={subConcept.id} className={styles.subConceptRow}>
                              <span className={styles.dot} />
                              {subConcept.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
