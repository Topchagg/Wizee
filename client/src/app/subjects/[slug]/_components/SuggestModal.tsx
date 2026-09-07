import { Modal } from "@/components/Modal";
import styles from "../page.module.css";
import type { SuggestTarget } from "./types";

const KIND_LABEL: Record<SuggestTarget["kind"], string> = {
  theme: "Theme",
  concept: "Concept",
  "sub-concept": "Sub-concept",
};

export function SuggestModal({
  target,
  title,
  onTitleChange,
  suggesting,
  error,
  onSubmit,
  onClose,
}: {
  target: SuggestTarget;
  title: string;
  onTitleChange: (title: string) => void;
  suggesting: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={`Suggest a ${KIND_LABEL[target.kind]}`}
      onClose={() => !suggesting && onClose()}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={suggesting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={suggesting || !title.trim()}>
            {suggesting ? "Sending…" : "Send suggestion"}
          </button>
        </>
      }
    >
      <p className={styles.suggestHint}>
        Under <strong>{target.parentLabel}</strong>. An admin reviews every suggestion before it&rsquo;s added to the tree.
      </p>
      <input
        className="input"
        autoFocus
        placeholder={target.placeholder}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        disabled={suggesting}
      />
      {error && <p className={`text-danger ${styles.suggestError}`}>{error}</p>}
    </Modal>
  );
}
