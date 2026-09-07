import { useState } from "react";
import styles from "../page.module.css";

// Every "add" row is a self-contained form — it owns its own input text and
// submitting state, so the tree above doesn't need a title/loading slot per
// node in the whole structure just to support typing into one at a time.
export function AddChildForm({ placeholder, onSubmit }: { placeholder: string; onSubmit: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(title.trim());
      setTitle("");
    } catch {
      setError("Couldn't add that.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.addRow}>
      <input
        className="input"
        placeholder={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
        disabled={submitting}
      />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => void handleSubmit()}
        disabled={submitting || !title.trim()}
      >
        {submitting ? "Adding…" : "+ Add"}
      </button>
      {error && <span className={styles.addError}>{error}</span>}
    </div>
  );
}
