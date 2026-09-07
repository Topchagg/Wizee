import styles from "../page.module.css";
import { HwTaskCard } from "./HwTaskCard";
import { SolvedTaskCard } from "./SolvedTaskCard";
import type { TaskResult, TestInfo } from "./types";

// Golden rule this whole step follows: once solved-on-screen tasks have been
// fetched (via "Get other tasks"), they REPLACE the homework list entirely —
// never shown side by side. Re-entering this step from the video always
// resets back to homework (see page.tsx's goToStep).
export function TestStep({
  slug,
  homeworkTasks,
  hwAnswers,
  hwResults,
  submittingTaskId,
  onSelectHw,
  onSubmitHw,
  solvedTasks,
  solvedAnswers,
  solvedResults,
  submittingSolvedTaskId,
  onSelectSolved,
  onSubmitSolved,
  solvedOnScreenCount,
  allHwAttempted,
  loadingSolved,
  onFetchSolvedTasks,
  onBack,
  altLoading,
  onAnotherExplanation,
  nextLoading,
  onNext,
}: {
  slug: string;
  homeworkTasks: TestInfo[];
  hwAnswers: Record<string, string>;
  hwResults: Record<string, TaskResult>;
  submittingTaskId: string | null;
  onSelectHw: (taskId: string, choice: string) => void;
  onSubmitHw: (task: TestInfo) => void;
  solvedTasks: TestInfo[];
  solvedAnswers: Record<string, string>;
  solvedResults: Record<string, TaskResult>;
  submittingSolvedTaskId: string | null;
  onSelectSolved: (taskId: string, choice: string) => void;
  onSubmitSolved: (task: TestInfo) => void;
  solvedOnScreenCount: number;
  allHwAttempted: boolean;
  loadingSolved: boolean;
  onFetchSolvedTasks: () => void;
  onBack: () => void;
  altLoading: boolean;
  onAnotherExplanation: () => void;
  nextLoading: boolean;
  onNext: () => void;
}) {
  return (
    <>
      {solvedTasks.length > 0 ? (
        <div className={styles.hwList}>
          <h2 className={styles.practiceTitle}>
            Solved on-screen — {solvedTasks.length} task{solvedTasks.length === 1 ? "" : "s"}
          </h2>
          {solvedTasks.map((task) => (
            <SolvedTaskCard
              key={task.id}
              task={task}
              slug={slug}
              answer={solvedAnswers[task.id]}
              result={solvedResults[task.id]}
              submitting={submittingSolvedTaskId === task.id}
              onSelect={(choice) => onSelectSolved(task.id, choice)}
              onSubmit={() => onSubmitSolved(task)}
            />
          ))}
        </div>
      ) : (
        homeworkTasks.length > 0 && (
          <div className={styles.hwList}>
            <div className={styles.practiceHeader}>
              <h2 className={styles.practiceTitle}>
                Practice — {homeworkTasks.length} task{homeworkTasks.length === 1 ? "" : "s"}
              </h2>
              {/* Golden rule: "Get other tasks" only ever surfaces
                  solved-on-screen tasks, and only once every homework
                  task shown here has been attempted at least once. */}
              {solvedOnScreenCount > 0 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={onFetchSolvedTasks}
                  disabled={loadingSolved || !allHwAttempted}
                  title={allHwAttempted ? undefined : "Submit an answer to every task above to get new tasks"}
                >
                  {loadingSolved ? "Loading…" : "🎲 Get other tasks"}
                </button>
              )}
            </div>
            {homeworkTasks.map((task) => (
              <HwTaskCard
                key={task.id}
                task={task}
                answer={hwAnswers[task.id]}
                result={hwResults[task.id]}
                submitting={submittingTaskId === task.id}
                onSelect={(choice) => onSelectHw(task.id, choice)}
                onSubmit={() => onSubmitHw(task)}
              />
            ))}
          </div>
        )
      )}

      <div className={styles.actions}>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Back
        </button>
        <div className={styles.actionsRight}>
          {/* Always clickable — if they haven't submitted the practice question
              yet, handleAnotherExplanation redirects them to it instead of
              calling the (still server-gated) alternative endpoint. */}
          <button type="button" className="btn btn-secondary" onClick={onAnotherExplanation} disabled={altLoading}>
            {altLoading ? "Loading…" : "Another Explanation"}
          </button>
          <button type="button" className="btn btn-primary" onClick={onNext} disabled={nextLoading}>
            {nextLoading ? "Loading…" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
