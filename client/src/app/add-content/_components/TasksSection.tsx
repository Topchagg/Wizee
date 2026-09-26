import styles from "../page.module.css";
import { TaskEditor } from "./TaskEditor";
import type { TaskDraft } from "./types";

// HW (homework) and SW (solved-on-screen) tasks are kept in separate,
// visually distinct groups, not one flat form with a per-task checkbox —
// they're different things: HW is what a learner starts on, SW is only ever
// reached by rolling when they're stuck on an HW task, as a worked duplicate
// to check against. Which group a task lives in fixes its isSolvedOnScreen
// value; nothing toggles it after creation.
export function TasksSection({
  tasks,
  onUpdate,
  onRemove,
  onAdd,
}: {
  tasks: TaskDraft[];
  onUpdate: (id: string, patch: Partial<TaskDraft>) => void;
  onRemove: (id: string) => void;
  onAdd: (isSolvedOnScreen: boolean) => void;
}) {
  const hwTasks = tasks.filter((t) => !t.isSolvedOnScreen);
  const swTasks = tasks.filter((t) => t.isSolvedOnScreen);

  return (
    <section className={styles.tasksSection}>
      <div className={styles.taskGroup}>
        <div>
          <h2 className={styles.sectionTitle}>HW — Homework tasks (required)</h2>
          <p className={`text-secondary ${styles.tasksHint}`}>
            What learners see on the practice step right after the video. At least one is required.
          </p>
        </div>
        {hwTasks.map((task) => (
          <TaskEditor key={task.id} task={task} onChange={(patch) => onUpdate(task.id, patch)} onRemove={() => onRemove(task.id)} />
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAdd(false)}>
          + Add HW task
        </button>
      </div>

      <div className={styles.taskGroup}>
        <div>
          <h2 className={styles.sectionTitle}>SW — Solved on-screen (required)</h2>
          <p className={`text-secondary ${styles.tasksHint}`}>
            A duplicate of something you actually work out in the video — never a starting task, only reached
            when a learner rolls because they&rsquo;re stuck on an HW task, so they can rewatch and see it solved.
            At least one is required.
          </p>
        </div>
        {swTasks.map((task) => (
          <TaskEditor key={task.id} task={task} onChange={(patch) => onUpdate(task.id, patch)} onRemove={() => onRemove(task.id)} />
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onAdd(true)}>
          + Add SW task
        </button>
      </div>
    </section>
  );
}
