import styles from "../page.module.css";
import type { AddItem, SearchHit } from "./types";

export function SearchResults({
  searching,
  results,
  addedThemeIds,
  addedConceptIds,
  busy,
  onAdd,
}: {
  searching: boolean;
  results: SearchHit[] | null;
  addedThemeIds: Set<string | null>;
  addedConceptIds: Set<string | null>;
  busy: boolean;
  onAdd: AddItem;
}) {
  return (
    <div className={styles.searchResults}>
      {searching && <p className="text-secondary">Searching…</p>}
      {!searching && results?.length === 0 && <p className="text-secondary">No matches.</p>}
      {!searching &&
        results?.map((hit) => {
          const themeIdToAdd = hit.type === "THEME" ? hit.idLink : hit.themeId;
          const conceptIdToAdd = hit.type === "CONCEPT" ? hit.idLink : hit.type === "SUBCONCEPT" ? hit.conceptId : null;
          return (
            <div key={`${hit.type}-${hit.idLink}`} className={styles.searchHit}>
              <div className={styles.searchHitInfo}>
                <span className={`badge ${styles.hitTypeBadge}`}>{hit.type}</span>
                <span className={styles.searchHitName}>{hit.name}</span>
                {(hit.conceptTitle || hit.themeTitle) && (
                  <span className={styles.searchHitBreadcrumb}>
                    in {[hit.conceptTitle, hit.themeTitle].filter(Boolean).join(" › ")}
                  </span>
                )}
              </div>
              <div className={styles.searchHitActions}>
                {conceptIdToAdd && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onAdd("CONCEPT", undefined, conceptIdToAdd)}
                    disabled={busy || addedConceptIds.has(conceptIdToAdd)}
                  >
                    {addedConceptIds.has(conceptIdToAdd)
                      ? "Concept added ✓"
                      : hit.type === "CONCEPT"
                        ? "Add Concept"
                        : `Add "${hit.conceptTitle}"`}
                  </button>
                )}
                {themeIdToAdd && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAdd("THEME", themeIdToAdd)}
                    disabled={busy || addedThemeIds.has(themeIdToAdd)}
                  >
                    {addedThemeIds.has(themeIdToAdd) ? "Theme added ✓" : hit.type === "THEME" ? "Add whole Theme" : `Add Theme "${hit.themeTitle}"`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
