import Link from "next/link";
import styles from "../page.module.css";
import type { TaskResult, TestInfo } from "./types";

// A solved-on-screen task's own card — always from a SIBLING explanation
// (the server never returns this content's own), so it always links to that
// other content's page rather than this one's video.
export function SolvedTaskCard({
  task,
  slug,
  answer,
  result,
  submitting,
  onSelect,
  onSubmit,
}: {
  task: TestInfo;
  slug: string;
  answer: string | undefined;
  result: TaskResult | undefined;
  submitting: boolean;
  onSelect: (choice: string) => void;
  onSubmit: () => void;
}) {
  const choices = Array.isArray(task.choices) ? (task.choices as string[]) : [];
  return (
    <div className={`card ${styles.practice}`}>
      <div className={styles.practiceHeader}>
        <span className="badge">Worked out in another explanation</span>
        {task.contentId && (
          <Link href={`/learn/${slug}/${task.contentId}`} className="btn btn-ghost btn-sm">
            See it solved →
          </Link>
        )}
      </div>
      <p className={styles.prompt}>{task.prompt}</p>
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
