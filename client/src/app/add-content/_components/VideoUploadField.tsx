import styles from "../page.module.css";

export function VideoUploadField({
  label,
  uploadedUrl,
  progress,
  onFile,
}: {
  label: string;
  uploadedUrl: string | null;
  progress: number | null;
  onFile: (file: File) => void;
}) {
  return (
    <div className={styles.uploadField}>
      <span className="field-label">{label}</span>
      <input
        className={styles.fileInput}
        type="file"
        accept="video/*"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {progress !== null && progress < 100 && <p className={styles.progress}>Uploading… {progress}%</p>}
      {uploadedUrl && <p className={styles.uploaded}>Uploaded ✓</p>}
    </div>
  );
}
