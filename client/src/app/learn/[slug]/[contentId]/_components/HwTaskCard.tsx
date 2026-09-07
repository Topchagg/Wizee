import styles from "../page.module.css";
import type { TaskResult, TestInfo } from "./types";

// One homework task's own card — its own choice selection, its own submit,
// its own pass/fail feedback. The Test step renders one of these per task
// this content has, all visible at once (see the golden rule: moving from
// Video into Test always shows the FULL homework set, never just one).
export function HwTaskCard({
  task,
  answer,
  result,
  submitting,
  onSelect,
  onSubmit,
}: {
  task: TestInfo;
  answer: string | undefined;
  result: TaskResult | undefined;
  submitting: boolean;
  onSelect: (choice: string) => void;
  onSubmit: () => void;
}) {
  const choices = Array.isArray(task.choices) ? (task.choices as string[]) : [];
  return (
    <div className={`card ${styles.practice}`}>
      <p className={styles.prompt}>{task.prompt}</p>
      {!!task.attemptedCount && (
        // Same difficulty signal as the video-level pass rate, one level
        // down — creator-only (see toContentDto), a confusing or
        // too-easy/too-hard QUESTION is a separate signal from a weak video.
        <p className={styles.contentStat}>
          <strong>{Math.round((task.passRate ?? 0) * 100)}%</strong> pass rate ·{" "}
          {task.attemptedCount} {task.attemptedCount === 1 ? "learner" : "learners"}
        </p>
      )}
      <div className={styles.choices}>
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={answer === choice ? styles.choiceSelected : styles.choice}
            onClick={() => onSelect(choice)}
            disabled={submitting}
          >
            {choice}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={answer === undefined || submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </button>
      {result && (
        <p className={result === "passed" ? styles.pass : styles.fail}>
          {result === "passed" ? "✓ Correct!" : "✗ Not quite."}
        </p>
      )}
    </div>
  );
}
