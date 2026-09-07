import styles from "../page.module.css";
import { TaskEditor } from "./TaskEditor";
import type { TaskDraft } from "./types";

export function TasksSection({
  tasks,
  onUpdate,
  onRemove,
  onAdd,
}: {
  tasks: TaskDraft[];
  onUpdate: (index: number, patch: Partial<TaskDraft>) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  return (
    <section className={styles.tasksSection}>
      <h2 className={styles.sectionTitle}>Tasks (optional)</h2>
      <p className={`text-secondary ${styles.tasksHint}`}>
        Every task here starts as a homework task — what learners see on the practice step. Mark a task
        &ldquo;Solved on-screen&rdquo; only if it&rsquo;s a duplicate of something you actually work out in the
        video — those are never the starting task, they&rsquo;re only reached when a learner rolls because
        they&rsquo;re stuck, so they can rewatch and see it solved.
      </p>
      {tasks.map((task, index) => (
        <TaskEditor
          key={index}
          task={task}
          onChange={(patch) => onUpdate(index, patch)}
          onRemove={() => onRemove(index)}
          removeDisabled={tasks.length === 1}
        />
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={onAdd}>
        + Add task
      </button>
    </section>
  );
}
