import styles from "../page.module.css";
import type { TaskDraft, TaskType } from "./types";

export function TaskEditor({
  task,
  onChange,
  onRemove,
  removeDisabled,
}: {
  task: TaskDraft;
  onChange: (patch: Partial<TaskDraft>) => void;
  onRemove: () => void;
  removeDisabled: boolean;
}) {
  return (
    <div className={styles.taskCard}>
      <div className={styles.taskRow}>
        <select className="input" value={task.type} onChange={(e) => onChange({ type: e.target.value as TaskType })}>
          <option value="MULTIPLE_CHOICE">Multiple choice</option>
          <option value="FILL_GAP">Fill the gap</option>
          <option value="CALCULATION">Calculation</option>
          <option value="CODE_CHALLENGE">Code challenge</option>
        </select>
        <input className="input" placeholder="Prompt" value={task.prompt} onChange={(e) => onChange({ prompt: e.target.value })} />
        {task.type === "MULTIPLE_CHOICE" && (
          <input
            className="input"
            placeholder="Choices, comma-separated"
            value={task.choicesText}
            onChange={(e) => onChange({ choicesText: e.target.value })}
          />
        )}
        <input className="input" placeholder="Correct answer" value={task.answer} onChange={(e) => onChange({ answer: e.target.value })} />
      </div>
      <div className={styles.taskMeta}>
        <label className={styles.homeworkToggle}>
          <input type="checkbox" checked={task.isSolvedOnScreen} onChange={(e) => onChange({ isSolvedOnScreen: e.target.checked })} />
          Solved on-screen in the video
        </label>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove} disabled={removeDisabled}>
          Remove
        </button>
      </div>
    </div>
  );
}
