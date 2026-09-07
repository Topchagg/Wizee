"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";
import { AuthorCard } from "./_components/AuthorCard";
import { Breadcrumb } from "./_components/Breadcrumb";
import { PreviewStep } from "./_components/PreviewStep";
import { ProgressSidebar } from "./_components/ProgressSidebar";
import { SiblingsCard } from "./_components/SiblingsCard";
import { TestStep } from "./_components/TestStep";
import type { ContentInfo, Step, SubConceptDetail, TaskResult, TestInfo } from "./_components/types";
import { VideoStep } from "./_components/VideoStep";
import styles from "./page.module.css";

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
        <Breadcrumb breadcrumb={detail.breadcrumb} buildsOn={detail.buildsOn} />
        <h1 className={styles.title}>{detail.title}</h1>
        {content.description && <p className={styles.hook}>{content.description}</p>}

        {step === "preview" && content.previewVideo && (
          <PreviewStep
            previewVideo={content.previewVideo}
            previewDuration={previewDuration}
            onDuration={setPreviewDuration}
            onContinue={() => goToStep("video")}
          />
        )}

        {step === "video" && (
          <VideoStep
            videoRef={videoRef}
            videoSrc={content.video}
            contentId={content.id}
            hasPreview={!!content.previewVideo}
            onEnded={handleVideoEnded}
            onBack={() => goToStep("preview")}
            onContinue={() => goToStep("test")}
            altLoading={altLoading}
            onAnotherExplanation={() => void handleAnotherExplanation()}
          />
        )}

        {step === "test" && (
          <TestStep
            slug={slug}
            homeworkTasks={content.tests}
            hwAnswers={hwAnswers}
            hwResults={hwResults}
            submittingTaskId={submittingTaskId}
            onSelectHw={(taskId, choice) => setHwAnswers((prev) => ({ ...prev, [taskId]: choice }))}
            onSubmitHw={(task) => void handleSubmitHw(task)}
            solvedTasks={solvedTasks}
            solvedAnswers={solvedAnswers}
            solvedResults={solvedResults}
            submittingSolvedTaskId={submittingSolvedTaskId}
            onSelectSolved={(taskId, choice) => setSolvedAnswers((prev) => ({ ...prev, [taskId]: choice }))}
            onSubmitSolved={(task) => void handleSubmitSolved(task)}
            solvedOnScreenCount={content.solvedOnScreenCount}
            allHwAttempted={allHwAttempted}
            loadingSolved={loadingSolved}
            onFetchSolvedTasks={() => void handleFetchSolvedTasks()}
            onBack={() => goToStep("video")}
            altLoading={altLoading}
            onAnotherExplanation={() => void handleAnotherExplanation()}
            nextLoading={nextLoading}
            onNext={() => void handleNext()}
          />
        )}

        {error && <p className="text-danger">{error}</p>}
      </div>

      <aside className={styles.sidebar}>
        <SiblingsCard conceptTitle={detail.breadcrumb.concept} siblings={detail.siblings} currentSlug={slug} />
        <AuthorCard content={content} otherExplanations={otherExplanations} />
      </aside>

      <ProgressSidebar steps={steps} stepIndex={stepIndex} maxStepIndex={maxStepIndex} onGoToStep={goToStep} />

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
