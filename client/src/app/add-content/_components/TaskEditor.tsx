import styles from "../page.module.css";
import type { TaskDraft, TaskType } from "./types";

export function TaskEditor({
  task,
  onChange,
  onRemove,
}: {
  task: TaskDraft;
  onChange: (patch: Partial<TaskDraft>) => void;
  onRemove: () => void;
}) {
  const isMultipleChoice = task.type === "MULTIPLE_CHOICE";
  const correctSet = Array.isArray(task.answer) ? task.answer : [];

  // answer's shape flips between a free-text string and a checked-options
  // array depending on type — reset it on the way in/out of MULTIPLE_CHOICE
  // instead of carrying over a value that no longer means anything.
  const handleTypeChange = (type: TaskType) => {
    if (type === "MULTIPLE_CHOICE") {
      onChange(Array.isArray(task.answer) ? { type } : { type, answer: [] });
    } else {
      onChange(Array.isArray(task.answer) ? { type, answer: "" } : { type });
    }
  };

  // Keeps which options are marked correct pointed at the right text when
  // it's edited or removed, instead of silently going stale.
  const handleChoiceChange = (index: number, value: string) => {
    const oldValue = task.choices[index];
    const choices = task.choices.map((c, i) => (i === index ? value : c));
    const answer = correctSet.includes(oldValue) ? correctSet.map((c) => (c === oldValue ? value : c)) : correctSet;
    onChange({ choices, answer });
  };

  const handleRemoveChoice = (index: number) => {
    const removed = task.choices[index];
    const choices = task.choices.filter((_, i) => i !== index);
    onChange({ choices, answer: correctSet.filter((c) => c !== removed) });
  };

  const handleToggleCorrect = (choice: string) => {
    const answer = correctSet.includes(choice) ? correctSet.filter((c) => c !== choice) : [...correctSet, choice];
    onChange({ answer });
  };

  return (
    <div className={styles.taskCard}>
      <div className={styles.taskTopRow}>
        <select
          className={`input ${styles.taskTypeSelect}`}
          value={task.type}
          onChange={(e) => handleTypeChange(e.target.value as TaskType)}
        >
          <option value="MULTIPLE_CHOICE">Multiple choice</option>
          <option value="CALCULATION">Calculation</option>
        </select>
        <input className="input" placeholder="Prompt" value={task.prompt} onChange={(e) => onChange({ prompt: e.target.value })} />
      </div>

      {isMultipleChoice ? (
        <div className={styles.choicesBlock}>
          <span className={styles.choicesLabel}>Options — check all correct answers</span>
          {task.choices.map((choice, index) => (
            <div key={index} className={styles.choiceRow}>
              <input
                type="checkbox"
                className={styles.choiceCheckbox}
                checked={!!choice.trim() && correctSet.includes(choice)}
                onChange={() => handleToggleCorrect(choice)}
                disabled={!choice.trim()}
                title="Mark as correct"
                aria-label={`Mark option ${index + 1} as correct`}
              />
              <input
                className="input"
                placeholder={`Option ${index + 1}`}
                value={choice}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
              />
              <button
                type="button"
                className={styles.choiceRemoveBtn}
                onClick={() => handleRemoveChoice(index)}
                disabled={task.choices.length <= 2}
                title="Remove option"
                aria-label="Remove option"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange({ choices: [...task.choices, ""] })}>
            + Add option
          </button>
        </div>
      ) : (
        <label className={styles.answerField}>
          Correct answer
          <input
            className="input"
            placeholder="Correct answer"
            value={typeof task.answer === "string" ? task.answer : ""}
            onChange={(e) => onChange({ answer: e.target.value })}
          />
        </label>
      )}

      <div className={styles.taskMeta}>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
