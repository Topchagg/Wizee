import styles from "../page.module.css";
import type { TreeConcept, TreeSubConcept, TreeSubject, TreeTheme } from "./types";

// The four cascading Subject -> Theme -> Concept -> Sub-concept selects —
// picking a level resets everything below it (owned by the parent, since
// resetting also has to clear subConceptId which lives in page state).
export function SubConceptPicker({
  tree,
  subjectId,
  onSubjectChange,
  themeId,
  onThemeChange,
  themes,
  conceptId,
  onConceptChange,
  concepts,
  subConceptId,
  onSubConceptChange,
  subConcepts,
}: {
  tree: TreeSubject[];
  subjectId: string;
  onSubjectChange: (id: string) => void;
  themeId: string;
  onThemeChange: (id: string) => void;
  themes: TreeTheme[];
  conceptId: string;
  onConceptChange: (id: string) => void;
  concepts: TreeConcept[];
  subConceptId: string;
  onSubConceptChange: (id: string) => void;
  subConcepts: TreeSubConcept[];
}) {
  return (
    <div className={styles.pickerGrid}>
      <label className="field-label">
        Subject
        <select className="input" value={subjectId} onChange={(e) => onSubjectChange(e.target.value)}>
          <option value="">Choose…</option>
          {tree.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.title}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Theme
        <select className="input" value={themeId} onChange={(e) => onThemeChange(e.target.value)} disabled={!subjectId}>
          <option value="">Choose…</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.title}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Concept
        <select className="input" value={conceptId} onChange={(e) => onConceptChange(e.target.value)} disabled={!themeId}>
          <option value="">Choose…</option>
          {concepts.map((concept) => (
            <option key={concept.id} value={concept.id}>
              {concept.title}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        Sub-concept
        <select className="input" value={subConceptId} onChange={(e) => onSubConceptChange(e.target.value)} disabled={!conceptId}>
          <option value="">Choose…</option>
          {subConcepts.map((subConcept) => (
            <option key={subConcept.id} value={subConcept.id}>
              {subConcept.title}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
