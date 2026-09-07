"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type TestInfo = {
  id: string;
  type: string;
  prompt: string;
  choices: unknown;
  contentId?: string;
  // Only present on this content's own homework tasks (toContentDto) — never
  // on solved-on-screen tasks rolled in from a sibling content's own
  // endpoint, and null/0 unless the viewer is this content's creator.
  attemptedCount?: number;
  passRate?: number | null;
};
type ContentInfo = {
  id: string;
  video: string;
  previewVideo: string | null;
  description: string | null;
  creatorName: string | null;
  creatorId: string | null;
  creatorPhotoUrl: string | null;
  tests: TestInfo[];
  solvedOnScreenCount: number;
  attemptedCount: number;
  passRate: number | null;
  skipRate: number | null;
};
type SiblingSubConcept = { id: string; slug: string; title: string; contentId: string | null };
type BuildsOnEntry = { id: string; title: string; themeTitle: string; slug: string; contentId: string };
type SubConceptDetail = {
  id: string;
  slug: string;
  title: string;
  breadcrumb: { subject: string; theme: string; concept: string };
  content: ContentInfo | null;
  contentCount: number;
  masteredCount: number;
  siblings: SiblingSubConcept[];
  buildsOn: BuildsOnEntry[];
};

type Step = "preview" | "video" | "test";
type TaskResult = "passed" | "failed";

// Shared shell for every modal on this page (gate + no-alternative) — owns
// the overlay/card markup and Escape-to-close so neither caller repeats it.
function Modal({
  title,
  onClose,
  actions,
  children,
}: {
  title: string;
  onClose: () => void;
  actions: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-body">{children}</p>
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}

// One homework task's own card — its own choice selection, its own submit,
// its own pass/fail feedback. The Test step renders one of these per task
// this content has, all visible at once (see the golden rule: moving from
// Video into Test always shows the FULL homework set, never just one).
function HwTaskCard({
  task,
  answer,
  result,
  submitting,
  onSelect,
  onSubmit,
}: {
  task: TestInfo;
  answer: string | undefined;
  result: TaskResult | undefined;
  submitting: boolean;
  onSelect: (choice: string) => void;
  onSubmit: () => void;
}) {
  const choices = Array.isArray(task.choices) ? (task.choices as string[]) : [];
  return (
    <div className={`card ${styles.practice}`}>
      <p className={styles.prompt}>{task.prompt}</p>
      {!!task.attemptedCount && (
        // Same difficulty signal as the video-level pass rate, one level
        // down — creator-only (see toContentDto), a confusing or
        // too-easy/too-hard QUESTION is a separate signal from a weak video.
        <p className={styles.contentStat}>
          <strong>{Math.round((task.passRate ?? 0) * 100)}%</strong> pass rate ·{" "}
          {task.attemptedCount} {task.attemptedCount === 1 ? "learner" : "learners"}
        </p>
      )}
      <div className={styles.choices}>
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={answer === choice ? styles.choiceSelected : styles.choice}
            onClick={() => onSelect(choice)}
            disabled={submitting}
          >
            {choice}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={answer === undefined || submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </button>
      {result && (
        <p className={result === "passed" ? styles.pass : styles.fail}>
          {result === "passed" ? "✓ Correct!" : "✗ Not quite."}
        </p>
      )}
    </div>
  );
}

// A solved-on-screen task's own card — always from a SIBLING explanation
// (the server never returns this content's own), so it always links to that
// other content's page rather than this one's video.
function SolvedTaskCard({
  task,
  slug,
  answer,
  result,
  submitting,
  onSelect,
  onSubmit,
}: {
  task: TestInfo;
  slug: string;
  answer: string | undefined;
  result: TaskResult | undefined;
  submitting: boolean;
  onSelect: (choice: string) => void;
  onSubmit: () => void;
}) {
  const choices = Array.isArray(task.choices) ? (task.choices as string[]) : [];
  return (
    <div className={`card ${styles.practice}`}>
      <div className={styles.practiceHeader}>
        <span className="badge">Worked out in another explanation</span>
        {task.contentId && (
          <Link href={`/learn/${slug}/${task.contentId}`} className="btn btn-ghost btn-sm">
            See it solved →
          </Link>
        )}
      </div>
      <p className={styles.prompt}>{task.prompt}</p>
      <div className={styles.choices}>
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={answer === choice ? styles.choiceSelected : styles.choice}
            onClick={() => onSelect(choice)}
            disabled={submitting}
          >
            {choice}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={answer === undefined || submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </button>
      {result && (
        <p className={result === "passed" ? styles.pass : styles.fail}>
          {result === "passed" ? "✓ Correct!" : "✗ Not quite."}
        </p>
      )}
    </div>
  );
}

export default function LearnPage() {
  const { slug, contentId } = useParams<{ slug: string; contentId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [detail, setDetail] = useState<SubConceptDetail | null>(null);
  const [step, setStep] = useState<Step>("video");
  const [maxStepIndex, setMaxStepIndex] = useState(0);

  // Every homework task is shown at once — state is keyed by task id rather
  // than holding just "the current" answer/result.
  const [hwAnswers, setHwAnswers] = useState<Record<string, string>>({});
  const [hwResults, setHwResults] = useState<Record<string, TaskResult>>({});
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);

  // Every solved-on-screen task in the Sub-concept (always from SIBLING
  // explanations — never this content's own), shown instead of the homework
  // list once fetched (golden rule: interacting with "Get other tasks" while
  // on the Test step only ever surfaces solved-on-screen tasks). Each task
  // carries its own contentId since they can come from different siblings.
  const [solvedTasks, setSolvedTasks] = useState<TestInfo[]>([]);
  const [solvedAnswers, setSolvedAnswers] = useState<Record<string, string>>({});
  const [solvedResults, setSolvedResults] = useState<Record<string, TaskResult>>({});
  const [submittingSolvedTaskId, setSubmittingSolvedTaskId] = useState<string | null>(null);
  const [loadingSolved, setLoadingSolved] = useState(false);

  const [altLoading, setAltLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGateModal, setShowGateModal] = useState(false);
  const [showNoAltModal, setShowNoAltModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    // Deferred a microtask so the reset isn't a synchronous setState call in
    // the effect body (this is what actually shows the loading skeleton
    // during a slug/contentId change, instead of flashing stale content).
    Promise.resolve()
      .then(() => {
        setDetail(null);
        setError(null);
        setPreviewDuration(null);
        return apiFetch(`/sub-concepts/${slug}/content/${contentId}`);
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<SubConceptDetail>;
      })
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setHwAnswers({});
        setHwResults({});
        setSolvedTasks([]);
        setSolvedAnswers({});
        setSolvedResults({});
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
    const hwCount = detail?.content?.tests.length ?? 0;
    list.push({
      key: "test",
      label: "Test",
      caption: hwCount > 0 ? `${hwCount} quick question${hwCount === 1 ? "" : "s"} after the video` : "No quiz for this one",
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
  // solved-on-screen task. Coming back always shows the SAME full homework
  // set again, but with a clean slate (no stale answers/results/roll from
  // the previous attempt) — a real second try, per the golden rule that
  // moving Video -> Test always lands on homework.
  const goToStep = (key: Step) => {
    const idx = steps.findIndex((s) => s.key === key);
    if (idx === -1) return;
    if (key === "test" && step !== "test" && maxStepIndex >= idx) {
      setHwAnswers({});
      setHwResults({});
      setSolvedTasks([]);
      setSolvedAnswers({});
      setSolvedResults({});
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
    goToStep("test");
  };

  const handleSubmitHw = async (task: TestInfo) => {
    const answer = hwAnswers[task.id];
    if (!detail?.content || answer === undefined) return;
    setSubmittingTaskId(task.id);
    setError(null);
    try {
      const res = await apiFetch(`/sub-concepts/${slug}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: detail.content.id, taskId: task.id, answer }),
      });
      if (!res.ok) throw new Error();
      const result: { passed: boolean } = await res.json();
      setHwResults((prev) => ({ ...prev, [task.id]: result.passed ? "passed" : "failed" }));
    } catch {
      setError("Couldn't submit your answer — try again.");
    } finally {
      setSubmittingTaskId(null);
    }
  };

  const handleSubmitSolved = async (task: TestInfo) => {
    const answer = solvedAnswers[task.id];
    if (!detail?.content || answer === undefined || !task.contentId) return;
    setSubmittingSolvedTaskId(task.id);
    setError(null);
    try {
      const res = await apiFetch(`/sub-concepts/${slug}/attempts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: task.contentId, taskId: task.id, answer }),
      });
      if (!res.ok) throw new Error();
      const result: { passed: boolean } = await res.json();
      setSolvedResults((prev) => ({ ...prev, [task.id]: result.passed ? "passed" : "failed" }));
    } catch {
      setError("Couldn't submit your answer — try again.");
    } finally {
      setSubmittingSolvedTaskId(null);
    }
  };

  // Golden rule: interacting with "Get other tasks" while already on the
  // Test step only ever surfaces solved-on-screen tasks — every one of them,
  // from every sibling explanation of this Sub-concept (a content-sub-concept
  // realistically only ever has a handful, so fetching the whole set is
  // cheap). Never this content's own — see getSolvedOnScreenTasks server-side.
  const handleFetchSolvedTasks = async () => {
    if (!detail?.content) return;
    setLoadingSolved(true);
    setError(null);
    try {
      const res = await apiFetch(`/sub-concepts/${slug}/content/${detail.content.id}/tasks/solved-on-screen`);
      if (!res.ok) throw new Error();
      const tasks: TestInfo[] = await res.json();
      setSolvedTasks(tasks);
      setSolvedAnswers({});
      setSolvedResults({});
    } catch {
      setError("No solved examples available yet.");
    } finally {
      setLoadingSolved(false);
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
      setShowNoAltModal(true);
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
  const otherExplanations = detail.contentCount - 1;
  const allHwAttempted = content.tests.length > 0 && content.tests.every((t) => hwResults[t.id] !== undefined);

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
        {detail.buildsOn.length > 0 && (
          // Light, non-blocking note — never a hard gate (readme: the
          // platform surfaces information, it doesn't withhold access).
          <p className={styles.buildsOn}>
            Builds on:{" "}
            {detail.buildsOn.map((b, i) => (
              <span key={b.id}>
                {i > 0 && ", "}
                <Link href={`/learn/${b.slug}/${b.contentId}`} className={styles.buildsOnLink}>
                  {b.title}
                </Link>
              </span>
            ))}
          </p>
        )}
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
              <button type="button" className="btn btn-primary" onClick={() => goToStep("video")}>
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
              <div className={styles.stepFooterLeft}>
                {content.previewVideo && (
                  <button type="button" className="btn btn-ghost" onClick={() => goToStep("preview")}>
                    ← Back
                  </button>
                )}
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
              </div>
              <button type="button" className="btn btn-primary" onClick={() => goToStep("test")}>
                Continue to practice →
              </button>
            </div>
          </div>
        )}

        {step === "test" && (
          <>
            {solvedTasks.length > 0 ? (
              <div className={styles.hwList}>
                <h2 className={styles.practiceTitle}>
                  Solved on-screen — {solvedTasks.length} task{solvedTasks.length === 1 ? "" : "s"}
                </h2>
                {solvedTasks.map((task) => (
                  <SolvedTaskCard
                    key={task.id}
                    task={task}
                    slug={slug}
                    answer={solvedAnswers[task.id]}
                    result={solvedResults[task.id]}
                    submitting={submittingSolvedTaskId === task.id}
                    onSelect={(choice) => setSolvedAnswers((prev) => ({ ...prev, [task.id]: choice }))}
                    onSubmit={() => void handleSubmitSolved(task)}
                  />
                ))}
              </div>
            ) : (
              content.tests.length > 0 && (
                <div className={styles.hwList}>
                  <div className={styles.practiceHeader}>
                    <h2 className={styles.practiceTitle}>Practice — {content.tests.length} task{content.tests.length === 1 ? "" : "s"}</h2>
                    {/* Golden rule: "Get other tasks" only ever surfaces
                        solved-on-screen tasks, and only once every homework
                        task shown here has been attempted at least once. */}
                    {content.solvedOnScreenCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => void handleFetchSolvedTasks()}
                        disabled={loadingSolved || !allHwAttempted}
                        title={allHwAttempted ? undefined : "Submit an answer to every task above to get new tasks"}
                      >
                        {loadingSolved ? "Loading…" : "🎲 Get other tasks"}
                      </button>
                    )}
                  </div>
                  {content.tests.map((task) => (
                    <HwTaskCard
                      key={task.id}
                      task={task}
                      answer={hwAnswers[task.id]}
                      result={hwResults[task.id]}
                      submitting={submittingTaskId === task.id}
                      onSelect={(choice) => setHwAnswers((prev) => ({ ...prev, [task.id]: choice }))}
                      onSubmit={() => void handleSubmitHw(task)}
                    />
                  ))}
                </div>
              )
            )}

            <div className={styles.actions}>
              <button type="button" className="btn btn-ghost" onClick={() => goToStep("video")}>
                ← Back
              </button>
              <div className={styles.actionsRight}>
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
            {content.attemptedCount > 0 && (
              // Difficulty signal, creator-only — the server only ever
              // computes these when the viewer IS this content's creator
              // (see SubConceptsService.toContentDto); anyone else always
              // gets attemptedCount 0, which keeps this block hidden without
              // the client needing its own role check. Based on distinct
              // learners, not raw attempt counts, so retries don't skew it.
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
                      onClick={() => clickable && goToStep(s.key)}
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
        <Modal
          title="Solve the practice question first"
          onClose={() => setShowGateModal(false)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setShowGateModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowGateModal(false);
                  goToStep("test");
                }}
              >
                Go to practice →
              </button>
            </>
          }
        >
          Your first &ldquo;Another Explanation&rdquo; was free — after that, submit the practice question before
          switching explanations again.
        </Modal>
      )}

      {showNoAltModal && (
        <Modal
          title="No alternative explanation yet"
          onClose={() => setShowNoAltModal(false)}
          actions={
            <button type="button" className="btn btn-primary" onClick={() => setShowNoAltModal(false)}>
              Got it
            </button>
          }
        >
          Nobody else has submitted an explanation for this Sub-concept yet — check back later.
        </Modal>
      )}
    </div>
  );
}
