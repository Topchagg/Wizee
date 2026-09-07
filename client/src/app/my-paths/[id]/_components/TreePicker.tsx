import styles from "../page.module.css";
import { SearchResults } from "./SearchResults";
import { SubjectGrid } from "./SubjectGrid";
import { TreeBrowser } from "./TreeBrowser";
import type { AddItem, SearchHit, TreeSubject } from "./types";

// The right "Add from the tree" section — a Subject tile grid until one is
// picked, then either search results or the Theme/Concept browser for it.
export function TreePicker({
  tree,
  selectedSubject,
  onOpenSubject,
  onCloseSubject,
  query,
  onQueryChange,
  searching,
  searchResults,
  expandedThemes,
  onExpandedThemesChange,
  expandedConcepts,
  onExpandedConceptsChange,
  addedThemeIds,
  addedConceptIds,
  busy,
  onAdd,
}: {
  tree: TreeSubject[];
  selectedSubject: TreeSubject | null;
  onOpenSubject: (subjectId: string) => void;
  onCloseSubject: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  searching: boolean;
  searchResults: SearchHit[] | null;
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
    <section className={`card ${styles.section} ${styles.treeSidebar}`}>
      <h2 className={styles.sectionTitle}>Add from the tree</h2>

      {!selectedSubject ? (
        <SubjectGrid tree={tree} onSelect={onOpenSubject} />
      ) : (
        <div className={styles.subjectPanel}>
          <div className={styles.subjectPanelHeader}>
            <button type="button" className={styles.backToSubjects} onClick={onCloseSubject}>
              ← All subjects
            </button>
            <span className={styles.subjectPanelTitle}>{selectedSubject.title}</span>
          </div>

          <input
            className="input"
            placeholder="Search themes, concepts, or sub-concepts…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />

          {query.trim() ? (
            <SearchResults
              searching={searching}
              results={searchResults}
              addedThemeIds={addedThemeIds}
              addedConceptIds={addedConceptIds}
              busy={busy}
              onAdd={onAdd}
            />
          ) : (
            <TreeBrowser
              themes={selectedSubject.themes}
              expandedThemes={expandedThemes}
              onExpandedThemesChange={onExpandedThemesChange}
              expandedConcepts={expandedConcepts}
              onExpandedConceptsChange={onExpandedConceptsChange}
              addedThemeIds={addedThemeIds}
              addedConceptIds={addedConceptIds}
              busy={busy}
              onAdd={onAdd}
            />
          )}
        </div>
      )}
    </section>
  );
}
