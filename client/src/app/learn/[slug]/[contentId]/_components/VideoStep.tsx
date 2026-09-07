import type { RefObject } from "react";
import styles from "../page.module.css";

export function VideoStep({
  videoRef,
  videoSrc,
  contentId,
  hasPreview,
  onEnded,
  onBack,
  onContinue,
  altLoading,
  onAnotherExplanation,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  contentId: string;
  hasPreview: boolean;
  onEnded: () => void;
  onBack: () => void;
  onContinue: () => void;
  altLoading: boolean;
  onAnotherExplanation: () => void;
}) {
  return (
    <div className={`card ${styles.stepCard}`}>
      <div className={styles.videoFrame}>
        {/* key forces a fresh <video> element when switching to an alternative */}
        <video ref={videoRef} key={contentId} src={videoSrc} controls onEnded={onEnded} className={styles.video} />
      </div>
      <div className={styles.stepFooterBetween}>
        <div className={styles.stepFooterLeft}>
          {hasPreview && (
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              ← Back
            </button>
          )}
          {/* Always clickable — if they haven't submitted the practice question
              yet, handleAnotherExplanation redirects them to it instead of
              calling the (still server-gated) alternative endpoint. */}
          <button type="button" className="btn btn-secondary" onClick={onAnotherExplanation} disabled={altLoading}>
            {altLoading ? "Loading…" : "Another Explanation"}
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          Continue to practice →
        </button>
      </div>
    </div>
  );
}
