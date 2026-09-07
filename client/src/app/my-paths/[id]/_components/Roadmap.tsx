import styles from "../page.module.css";
import type { PathItem } from "./types";

// The left "Your path" section — the ordered roadmap of what a learner
// following this path moves through, plus the Publish action.
export function Roadmap({
  items,
  busy,
  isPublic,
  onMove,
  onRemove,
  onPublish,
}: {
  items: PathItem[];
  busy: boolean;
  isPublic: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (itemId: string) => void;
  onPublish: () => void;
}) {
  return (
    <section className={`card ${styles.section} ${styles.pathSidebar}`}>
      <div>
        <h2 className={styles.sectionTitle}>Your path</h2>
        <p className={`text-secondary ${styles.pathSubtitle}`}>
          A learner following this path moves through these, top to bottom.
        </p>
      </div>

      {items.length === 0 ? (
        <div className={styles.roadmap}>
          <div className={styles.roadmapNode}>
            <div className={styles.roadmapMarker}>
              <span className={styles.startMarker}>▶</span>
            </div>
            <p className={`text-secondary ${styles.emptyRoadmapHint}`}>Add a Theme or Concept below to lay the first step.</p>
          </div>
        </div>
      ) : (
        <ol className={`${styles.roadmap} ${styles.roadmapPopulated}`}>
          <li className={`${styles.roadmapNode} ${styles.startNode}`}>
            <div className={styles.roadmapMarker}>
              <span className={styles.startMarker}>▶</span>
            </div>
            <span className={styles.roadmapEndpointLabel}>Start</span>
          </li>
          {items.map((item, index) => (
            <li key={item.id} className={styles.roadmapNode}>
              <div className={styles.roadmapMarker}>
                <span className={styles.stepCircle}>{index + 1}</span>
              </div>
              <div className={styles.roadmapCard}>
                <span className={styles.itemLabel}>
                  <span className="badge">{item.itemType}</span> {item.label}
                </span>
                <span className={styles.itemButtons}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMove(index, -1)} disabled={busy || index === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => onMove(index, 1)}
                    disabled={busy || index === items.length - 1}
                  >
                    ↓
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(item.id)} disabled={busy}>
                    Remove
                  </button>
                </span>
              </div>
            </li>
          ))}
          <li className={styles.roadmapNode}>
            <div className={styles.roadmapMarker}>
              <span className={styles.goalMarker}>🏁</span>
            </div>
            <span className={styles.roadmapEndpointLabel}>Goal</span>
          </li>
        </ol>
      )}

      <button type="button" className="btn btn-primary" onClick={onPublish} disabled={busy || isPublic}>
        {isPublic ? "Published" : "Publish"}
      </button>
    </section>
  );
}
