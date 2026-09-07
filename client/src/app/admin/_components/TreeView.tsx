import styles from "../page.module.css";
import { SubjectRow } from "./SubjectRow";
import type { TreeActions, TreeSubject } from "./types";

export function TreeView({ tree, actions }: { tree: TreeSubject[]; actions: TreeActions }) {
  return (
    <div className={`card ${styles.tree}`}>
      {tree.length === 0 && <p className="text-secondary">No Subjects yet — add one above.</p>}
      {tree.map((subject) => (
        <SubjectRow key={subject.id} subject={subject} actions={actions} />
      ))}
    </div>
  );
}
