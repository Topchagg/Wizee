import Link from "next/link";
import styles from "../page.module.css";

export function SuccessCard({ onAddAnother }: { onAddAnother: () => void }) {
  return (
    <div className="page-shell">
      <div className={`card ${styles.successCard}`}>
        <span className={styles.successIcon}>✓</span>
        <p className={styles.successText}>Content added to the Sub-concept.</p>
        <div className={styles.successActions}>
          <button type="button" className="btn btn-primary" onClick={onAddAnother}>
            Add another
          </button>
          <Link href="/" className="btn btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
