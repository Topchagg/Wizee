import styles from "../page.module.css";

export function StatsCard({
  themeCount,
  conceptCount,
  subConceptCount,
  percentFilled,
}: {
  themeCount: number;
  conceptCount: number;
  subConceptCount: number;
  percentFilled: number;
}) {
  return (
    <div className={`card ${styles.statsCard}`}>
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{themeCount}</span>
          <span className={styles.statLabel}>{themeCount === 1 ? "Theme" : "Themes"}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{conceptCount}</span>
          <span className={styles.statLabel}>{conceptCount === 1 ? "Concept" : "Concepts"}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{subConceptCount}</span>
          <span className={styles.statLabel}>Sub-concepts</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{percentFilled}%</span>
          <span className={styles.statLabel}>Filled</span>
        </div>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${percentFilled}%` }} />
      </div>
    </div>
  );
}
