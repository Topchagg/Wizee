import styles from "../page.module.css";
import { toggleSetMember } from "@/lib/set-utils";
import { ConceptRow } from "./ConceptRow";
import type { SuggestTarget, TreeTheme } from "./types";

export function ThemeTree({
  themes,
  expandedThemes,
  onExpandedThemesChange,
  expandedConcepts,
  onExpandedConceptsChange,
  onSuggest,
}: {
  themes: TreeTheme[];
  expandedThemes: Set<string>;
  onExpandedThemesChange: (next: Set<string>) => void;
  expandedConcepts: Set<string>;
  onExpandedConceptsChange: (next: Set<string>) => void;
  onSuggest: (target: SuggestTarget) => void;
}) {
  return (
    <div className={`card ${styles.tree}`}>
      {themes.length === 0 && <p className="text-secondary">No Themes yet.</p>}
      {themes.map((theme) => {
        const themeOpen = expandedThemes.has(theme.id);
        return (
          <div key={theme.id} className={styles.themeBlock}>
            <div className={styles.rowShell}>
              <button
                type="button"
                className={styles.themeRow}
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
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  onSuggest({ kind: "concept", parentId: theme.id, parentLabel: theme.title, placeholder: "e.g. Linear equations" })
                }
              >
                + Suggest
              </button>
            </div>

            {themeOpen && (
              <div className={styles.concepts}>
                {theme.concepts.map((concept) => (
                  <ConceptRow
                    key={concept.id}
                    concept={concept}
                    open={expandedConcepts.has(concept.id)}
                    onToggle={() => onExpandedConceptsChange(toggleSetMember(expandedConcepts, concept.id))}
                    onSuggest={() =>
                      onSuggest({
                        kind: "sub-concept",
                        parentId: concept.id,
                        parentLabel: concept.title,
                        placeholder: "e.g. Solving for x",
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
