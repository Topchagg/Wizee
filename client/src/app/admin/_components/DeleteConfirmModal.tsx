import { Modal } from "@/components/Modal";
import type { PendingDelete } from "./types";

// Deletion cascades all the way down (see AdminService server-side) — this
// modal replaces a native confirm() so it matches the rest of the app's
// dialogs.
export function DeleteConfirmModal({
  pendingDelete,
  deleting,
  onCancel,
  onConfirm,
}: {
  pendingDelete: PendingDelete;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={`Delete "${pendingDelete.title}"?`}
      onClose={() => !deleting && onCancel()}
      actions={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </>
      }
    >
      This also deletes every {pendingDelete.kind} nested under it — this can&rsquo;t be undone.
    </Modal>
  );
}
