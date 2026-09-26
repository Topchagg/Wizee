import styles from "../page.module.css";
import type { SubConceptSearchHit, TreeConcept, TreeSubConcept, TreeSubject, TreeTheme } from "./types";

// The four cascading Subject -> Theme -> Concept -> Sub-concept selects —
// picking a level resets everything below it (owned by the parent, since
// resetting also has to clear subConceptId which lives in page state). A
// search box sits above them as a shortcut straight to a named Sub-concept,
// for a tutor who already knows the slot they want to fill.
export function SubConceptPicker({
  tree,
  query,
  onQueryChange,
  searching,
  searchResults,
  onPickSearchHit,
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
  query: string;
  onQueryChange: (query: string) => void;
  searching: boolean;
  searchResults: SubConceptSearchHit[] | null;
  onPickSearchHit: (hit: SubConceptSearchHit) => void;
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
    <div className={styles.pickerWrap}>
      <label className="field-label">
        Search Sub-concepts
        <input
          className="input"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="e.g. Matrix multiplication…"
        />
      </label>

      {query.trim() && (
        <div className={styles.searchResults}>
          {searching && <p className="text-secondary">Searching…</p>}
          {!searching && searchResults?.length === 0 && <p className="text-secondary">No matches.</p>}
          {!searching &&
            searchResults?.map((hit) => (
              <button
                key={hit.subConceptId}
                type="button"
                className={styles.searchHit}
                onClick={() => onPickSearchHit(hit)}
              >
                <span className={styles.searchHitInfo}>
                  <span className={styles.searchHitName}>{hit.name}</span>
                  <span className={styles.searchHitBreadcrumb}>
                    in {hit.conceptTitle} › {hit.themeTitle}
                  </span>
                </span>
                <span className={`badge ${styles.searchHitCount}`}>
                  {hit.contentCount === 0 ? "empty slot" : `${hit.contentCount} explanation${hit.contentCount === 1 ? "" : "s"}`}
                </span>
              </button>
            ))}
        </div>
      )}

      <div className={styles.pickerDivider}>or browse the tree</div>

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
    </div>
  );
}
