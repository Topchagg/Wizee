import styles from "../page.module.css";
import { SUGGESTION_KIND_LABEL, suggestionContext, type Suggestion } from "./types";

export function SuggestionsPanel({
  suggestions,
  workingSuggestionId,
  onDecide,
}: {
  suggestions: Suggestion[];
  workingSuggestionId: string | null;
  onDecide: (id: string, action: "approve" | "reject") => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className={`card ${styles.suggestionsCard}`}>
      <h2 className={styles.suggestionsTitle}>
        Suggestions <span className="badge">{suggestions.length}</span>
      </h2>
      <ul className={styles.suggestionsList}>
        {suggestions.map((s) => (
          <li key={s.id} className={styles.suggestionRow}>
            <div className={styles.suggestionInfo}>
              <span className="badge">{SUGGESTION_KIND_LABEL[s.type]}</span>
              <span className={styles.suggestionTitle}>{s.title}</span>
              <span className={styles.suggestionContext}>under {suggestionContext(s)}</span>
              <span className={styles.suggestionBy}>— suggested by {s.suggestedBy.displayName ?? s.suggestedBy.email}</span>
            </div>
            <div className={styles.suggestionActions}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onDecide(s.id, "reject")}
                disabled={workingSuggestionId === s.id}
              >
                Reject
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onDecide(s.id, "approve")}
                disabled={workingSuggestionId === s.id}
              >
                {workingSuggestionId === s.id ? "Working…" : "Approve"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
