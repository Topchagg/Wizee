import Link from "next/link";
import styles from "../page.module.css";
import type { ContentInfo } from "./types";

export function AuthorCard({ content, otherExplanations }: { content: ContentInfo; otherExplanations: number }) {
  if (!content.creatorName) return null;

  return (
    <div className={`card ${styles.authorCard}`}>
      <h2 className={styles.siblingHeading}>Author</h2>
      <div className={styles.authorRow}>
        <span className={styles.creatorAvatar}>
          {content.creatorPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Storage/photo URL, not a local asset
            <img src={content.creatorPhotoUrl} alt="" className={styles.creatorAvatarImg} />
          ) : (
            content.creatorName.trim().charAt(0).toUpperCase()
          )}
        </span>
        <div className={styles.creatorInfo}>
          <span className={styles.creatorLabel}>
            Explained by <strong>{content.creatorName}</strong>
          </span>
          {otherExplanations > 0 && <span className={styles.creatorBadge}>Other explanation available</span>}
        </div>
      </div>
      {content.creatorId && (
        <Link href={`/chat/${content.creatorId}`} className={`btn btn-secondary btn-sm ${styles.contactButton}`}>
          Contact teacher
        </Link>
      )}
      {content.attemptedCount > 0 && (
        // Difficulty signal, creator-only — the server only ever computes
        // these when the viewer IS this content's creator (see
        // SubConceptsService.toContentDto); anyone else always gets
        // attemptedCount 0, which keeps this block hidden without the
        // client needing its own role check. Based on distinct learners,
        // not raw attempt counts, so retries don't skew it.
        <div className={styles.contentStats}>
          <span className={styles.contentStat}>
            <strong>{Math.round((content.passRate ?? 0) * 100)}%</strong> pass rate
          </span>
          <span className={styles.contentStat}>
            <strong>{Math.round((content.skipRate ?? 0) * 100)}%</strong> ask for another explanation
          </span>
          <span className={styles.contentStatMeta}>
            based on {content.attemptedCount} {content.attemptedCount === 1 ? "learner" : "learners"}
          </span>
        </div>
      )}
    </div>
  );
}
