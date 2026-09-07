import styles from "../page.module.css";
import type { TreeSubject } from "./types";

export function SubjectGrid({ tree, onSelect }: { tree: TreeSubject[]; onSelect: (subjectId: string) => void }) {
  return (
    <div className={styles.subjectGrid}>
      {tree.map((subject) => {
        const conceptCount = subject.themes.flatMap((t) => t.concepts).length;
        return (
          <button key={subject.id} type="button" className={styles.subjectTile} onClick={() => onSelect(subject.id)}>
            <span className={styles.subjectTileTitle}>{subject.title}</span>
            <span className={styles.subjectTileMeta}>
              {subject.themes.length} {subject.themes.length === 1 ? "theme" : "themes"} · {conceptCount}{" "}
              {conceptCount === 1 ? "concept" : "concepts"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
