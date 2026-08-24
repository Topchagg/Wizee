"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type TestInfo = { id: string; type: string; prompt: string; choices: unknown };
type ContentInfo = {
  id: string;
  video: string;
  previewVideo: string | null;
  description: string | null;
  creatorName: string | null;
  creatorId: string | null;
  creatorPhotoUrl: string | null;
  test: TestInfo | null;
  solvedOnScreenCount: number;
};
type SiblingSubConcept = { id: string; slug: string; title: string; contentId: string | null };
type SubConceptDetail = {
  id: string;
  slug: string;
  title: string;
  breadcrumb: { subject: string; theme: string; concept: string };
  content: ContentInfo | null;
  contentCount: number;
  masteredCount: number;
  siblings: SiblingSubConcept[];
};

type Step = "preview" | "video" | "test";

export default function LearnPage() {
  const { slug, contentId } = useParams<{ slug: string; contentId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [detail, setDetail] = useState<SubConceptDetail | null>(null);
  const [step, setStep] = useState<Step>("video");
  const [maxStepIndex, setMaxStepIndex] = useState(0);
  const [task, setTask] = useState<TestInfo | null>(null);
  const [taskIsSolvedOnScreen, setTaskIsSolvedOnScreen] = useState(false);
  const [lastHwTaskId, setLastHwTaskId] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<"passed" | "failed" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [altLoading, setAltLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGateModal, setShowGateModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!showGateModal) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setShowGateModal(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showGateModal]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    setDetail(null);
    setError(null);
    setPreviewDuration(null);
    apiFetch(`/sub-concepts/${slug}/content/${contentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<SubConceptDetail>;
      })
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setTask(data.content?.test ?? null);
        setTaskIsSolvedOnScreen(false);
        setLastHwTaskId(data.content?.test?.id ?? null);
        setSelected(null);
        setLastResult(null);
        const startStep: Step = data.content?.previewVideo ? "preview" : "video";
        setStep(startStep);
        setMaxStepIndex(0);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this concept.");
      });

    return () => {
      cancelled = true;
    };
  }, [slug, contentId, user, authLoading, router]);

  const steps = useMemo(() => {
    const list: { key: Step; label: string; caption: string }[] = [];
    if (detail?.content?.previewVideo) {
      list.push({ key: "preview", label: "Preview", caption: "A quick real-world hook" });
    }
    list.push({ key: "video", label: "Video", caption: "The full explanation" });
    list.push({
      key: "test",
      label: "Test",
      caption: detail?.content?.test ? "1 quick question after the video" : "No quiz for this one",
    });
    return list;
  }, [detail]);

  const stepIndex = steps.findIndex((s) => s.key === step);

  // Only called two ways: the stepper dots (which gate themselves via
  // `clickable` in the render below, so a future step is never clickable)
  // and deliberate forward actions (Continue buttons, video end) — neither
  // needs an additional guard here.
  //
  // Re-entering "test" after already having been there (maxStepIndex already
  // covers it, since test is always the last step) means the learner went
  // back to rewatch the video — e.g. because they got stuck on a
  // solved-on-screen task. Coming back always hands them a FRESH homework
  // task, excluding whichever one was last shown, so it's a real second try
  // and never a repeat.
  const goToStep = async (key: Step) => {
    const idx = steps.findIndex((s) => s.key === key);
    if (idx === -1) return;
    if (key === "test" && step !== "test" && maxStepIndex >= idx) {
      await handleRollTask("homework");
    }
    setStep(key);
    setMaxStepIndex((m) => Math.max(m, idx));
  };

  const handleVideoEnded = () => {
    if (!detail?.content) return;
    void apiFetch(`/sub-concepts/${slug}/watch-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentId: detail.content.id,
        watchedSeconds: Math.round(videoRef.current?.duration ?? 0),
        completed: true,
      }),
    });
    void goToStep("test");
  };

  const handleSubmit = async () => {
    if (!detail?.content || !task || selected === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/sub-concepts/${slug}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: detail.content.id, taskId: task.id, answer: selected }),
      });
      if (!res.ok) throw new Error();
      const result: { passed: boolean } = await res.json();
      setLastResult(result.passed ? "passed" : "failed");
    } catch {
      setError("Couldn't submit your answer — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Bidirectional roll, available any time on the Test step — not just when
  // stuck, since a learner may just want more reps after passing too.
  // pool="solvedOnScreen": fetch a task actually worked out in the video (the
  // guaranteed-answer fallback). pool="homework": go back to a fresh HW
  // question, excluding whichever HW task was last shown so it's a real
  // second attempt, not a repeat.
  const handleRollTask = async (pool: "solvedOnScreen" | "homework") => {
    if (!detail?.content) return;
    setRolling(true);
    setError(null);
    try {
      const query =
        pool === "homework" && lastHwTaskId
          ? `pool=homework&exclude=${lastHwTaskId}`
          : `pool=${pool}`;
      const res = await apiFetch(`/sub-concepts/${slug}/content/${detail.content.id}/tasks/random?${query}`);
      if (!res.ok) throw new Error();
      const rolled: TestInfo = await res.json();
      setTask(rolled);
      setTaskIsSolvedOnScreen(pool === "solvedOnScreen");
      if (pool === "homework") setLastHwTaskId(rolled.id);
      setSelected(null);
      setLastResult(null);
    } catch {
      setError(
        pool === "solvedOnScreen" ? "No solved example available yet." : "Couldn't get another question — try again.",
      );
    } finally {
      setRolling(false);
    }
  };

  const handleAnotherExplanation = async () => {
    setAltLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/sub-concepts/${slug}/content/${contentId}/alternative`);
      if (res.status === 403) {
        // First switch per Sub-concept is free; the server rejects any
        // further one until the practice question has been submitted.
        setShowGateModal(true);
        return;
      }
      if (!res.ok) throw new Error();
      const alt: ContentInfo = await res.json();
      router.push(`/learn/${slug}/${alt.id}`);
    } catch {
      setError("No alternative explanation available yet.");
    } finally {
      setAltLoading(false);
    }
  };

  const handleNext = async () => {
    setNextLoading(true);
    try {
      const res = await apiFetch(`/sub-concepts/${slug}/next`);
      const next: { slug: string; contentId: string | null } | null = res.ok ? await res.json() : null;
      router.push(next?.contentId ? `/learn/${next.slug}/${next.contentId}` : "/");
    } finally {
      setNextLoading(false);
    }
  };

  if (authLoading) {
    return <div className="skeleton">Loading…</div>;
  }

  // Without this, a failed fetch left `detail` null forever — stuck on the
  // spinner above instead of ever showing `error`.
  if (error && !detail) {
    return (
      <div className="page-shell">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!detail || !detail.content) {
    return <div className="skeleton">Loading…</div>;
  }

  const content = detail.content;
  const choices = Array.isArray(task?.choices) ? (task.choices as string[]) : [];
  const otherExplanations = detail.contentCount - 1;

  return (
    <div className={styles.learnShell}>
      <div className={styles.main}>
        <div className={styles.breadcrumb}>
          <span>{detail.breadcrumb.subject}</span>
          <span className={styles.crumbSep}>/</span>
          <span>{detail.breadcrumb.theme}</span>
          <span className={styles.crumbSep}>/</span>
          <span>{detail.breadcrumb.concept}</span>
        </div>
        <h1 className={styles.title}>{detail.title}</h1>
        {content.description && <p className={styles.hook}>{content.description}</p>}

        {step === "preview" && content.previewVideo && (
          <div className={`card ${styles.stepCard}`}>
            <div className={styles.videoFrame}>
              <span className="badge">{previewDuration ? `Preview · ${Math.round(previewDuration)}s` : "Preview"}</span>
              <video
                src={content.previewVideo}
                controls
                className={styles.previewVideo}
                onLoadedMetadata={(e) => setPreviewDuration(e.currentTarget.duration)}
              />
            </div>
            <div className={styles.stepFooter}>
              <button type="button" className="btn btn-primary" onClick={() => void goToStep("video")}>
                Continue to video →
              </button>
            </div>
          </div>
        )}

        {step === "video" && (
          <div className={`card ${styles.stepCard}`}>
            <div className={styles.videoFrame}>
              {/* key forces a fresh <video> element when switching to an alternative */}
              <video
                ref={videoRef}
                key={content.id}
                src={content.video}
                controls
                onEnded={handleVideoEnded}
                className={styles.video}
              />
            </div>
            <div className={styles.stepFooterBetween}>
              {/* Always clickable — if they haven't submitted the practice question
                  yet, handleAnotherExplanation redirects them to it instead of
                  calling the (still server-gated) alternative endpoint. */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void handleAnotherExplanation()}
                disabled={altLoading}
              >
                {altLoading ? "Loading…" : "Another Explanation"}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void goToStep("test")}>
                Continue to practice →
              </button>
            </div>
          </div>
        )}

        {step === "test" && (
          <>
            {task && (
              <div className={`card ${styles.practice}`}>
                <div className={styles.practiceHeader}>
                  <h2 className={styles.practiceTitle}>Practice</h2>
                  {taskIsSolvedOnScreen ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => void handleRollTask("homework")}
                      disabled={rolling || submitting}
                    >
                      {rolling ? "Loading…" : "🎲 Try a new task"}
                    </button>
                  ) : (
                    content.solvedOnScreenCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => void handleRollTask("solvedOnScreen")}
                        disabled={rolling || submitting}
                      >
                        {rolling ? "Loading…" : "🎲 See it solved"}
                      </button>
                    )
                  )}
                </div>
                {taskIsSolvedOnScreen && <span className="badge">Worked out in the video</span>}
                <p className={styles.prompt}>{task.prompt}</p>
                <div className={styles.choices}>
                  {choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={selected === choice ? styles.choiceSelected : styles.choice}
                      onClick={() => setSelected(choice)}
                      disabled={submitting}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleSubmit()}
                  disabled={selected === null || submitting}
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
                {lastResult && (
                  <p className={lastResult === "passed" ? styles.pass : styles.fail}>
                    {lastResult === "passed" ? "✓ Correct!" : "✗ Not quite."}
                  </p>
                )}
              </div>
            )}

            <div className={styles.actions}>
              {/* Always clickable — if they haven't submitted the practice question
                  yet, handleAnotherExplanation redirects them to it instead of
                  calling the (still server-gated) alternative endpoint. */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void handleAnotherExplanation()}
                disabled={altLoading}
              >
                {altLoading ? "Loading…" : "Another Explanation"}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void handleNext()}
                disabled={nextLoading}
              >
                {nextLoading ? "Loading…" : "Next →"}
              </button>
            </div>
          </>
        )}

        {error && <p className="text-danger">{error}</p>}
      </div>

      <aside className={styles.sidebar}>
        <div className={`card ${styles.siblingCard}`}>
          <h2 className={styles.siblingHeading}>{detail.breadcrumb.concept}</h2>
          <p className={styles.siblingSubheading}>Sub-concepts in this Concept</p>
          <ol className={styles.siblingList}>
            {detail.siblings.map((sib, idx) => {
              const isCurrent = sib.slug === slug;
              const rowClass = isCurrent ? styles.siblingRowActive : sib.contentId ? styles.siblingRow : styles.siblingRowEmpty;
              const rowContent = (
                <>
                  <span className={styles.siblingDot}>{isCurrent ? "●" : idx + 1}</span>
                  <span className={styles.siblingTitle}>{sib.title}</span>
                </>
              );
              return (
                <li key={sib.id}>
                  {sib.contentId && !isCurrent ? (
                    <Link href={`/learn/${sib.slug}/${sib.contentId}`} className={rowClass}>
                      {rowContent}
                    </Link>
                  ) : (
                    <span className={rowClass}>{rowContent}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {content.creatorName && (
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
          </div>
        )}
      </aside>

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
                      onClick={() => clickable && void goToStep(s.key)}
                      disabled={!clickable}
                    >
                      {state === "done" ? "✓" : idx + 1}
                    </button>
                    {idx < steps.length - 1 && (
                      <span className={idx < stepIndex ? styles.stepLineDone : styles.stepLine} />
                    )}
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

      {showGateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGateModal(false)}>
          <div className={`card ${styles.modalCard}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Solve the practice question first</h2>
            <p className={styles.modalBody}>
              Your first &ldquo;Another Explanation&rdquo; was free — after that, submit the practice question
              before switching explanations again.
            </p>
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowGateModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowGateModal(false);
                  void goToStep("test");
                }}
              >
                Go to practice →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
