import styles from "../page.module.css";

export function PreviewStep({
  previewVideo,
  previewDuration,
  onDuration,
  onContinue,
}: {
  previewVideo: string;
  previewDuration: number | null;
  onDuration: (seconds: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className={`card ${styles.stepCard}`}>
      <div className={styles.videoFrame}>
        <span className="badge">{previewDuration ? `Preview · ${Math.round(previewDuration)}s` : "Preview"}</span>
        <video
          src={previewVideo}
          controls
          className={styles.previewVideo}
          onLoadedMetadata={(e) => onDuration(e.currentTarget.duration)}
        />
      </div>
      <div className={styles.stepFooter}>
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          Continue to video →
        </button>
      </div>
    </div>
  );
}
