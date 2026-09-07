import styles from "../page.module.css";
import type { Step, StepMeta } from "./types";

export function ProgressSidebar({
  steps,
  stepIndex,
  maxStepIndex,
  onGoToStep,
}: {
  steps: StepMeta[];
  stepIndex: number;
  maxStepIndex: number;
  onGoToStep: (key: Step) => void;
}) {
  return (
    <aside className={styles.stepSidebar}>
      <div className={`card ${styles.stepCardList}`}>
        <h2 className={styles.siblingHeading}>Your progress</h2>
        <ol className={styles.stepList}>
          {steps.map((s, idx) => {
            const state = idx < stepIndex ? "done" : idx === stepIndex ? "active" : "upcoming";
            const clickable = idx <= maxStepIndex;
            return (
              <li key={s.key} className={styles.stepNode}>
                <div className={styles.stepNodeMarker}>
                  <button
                    type="button"
                    className={`${styles.stepDot} ${styles[`stepDot_${state}`]}`}
                    onClick={() => clickable && onGoToStep(s.key)}
                    disabled={!clickable}
                  >
                    {state === "done" ? "✓" : idx + 1}
                  </button>
                  {idx < steps.length - 1 && <span className={idx < stepIndex ? styles.stepLineDone : styles.stepLine} />}
                </div>
                <div className={styles.stepNodeBody}>
                  <span className={state === "upcoming" ? styles.stepLabelMuted : styles.stepLabel}>{s.label}</span>
                  <span className={styles.stepCaption}>{s.caption}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
