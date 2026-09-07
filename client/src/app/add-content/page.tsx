"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { canCreate, useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { getVideoDuration, uploadVideo } from "@/lib/upload";
import styles from "./page.module.css";

type TreeSubConcept = { id: string; title: string };
type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
type TreeSubject = { id: string; title: string; themes: TreeTheme[] };

type TaskType = "MULTIPLE_CHOICE" | "FILL_GAP" | "CALCULATION" | "CODE_CHALLENGE";
type TaskDraft = { type: TaskType; prompt: string; choicesText: string; answer: string; isSolvedOnScreen: boolean };

const emptyTask = (): TaskDraft => ({
  type: "MULTIPLE_CHOICE",
  prompt: "",
  choicesText: "",
  answer: "",
  isSolvedOnScreen: false,
});
const PREVIEW_MAX_SECONDS = 45;

export default function AddContentPage() {
  const { user, loading: authLoading, appUser, appUserLoading } = useAuth();
  const router = useRouter();

  const [tree, setTree] = useState<TreeSubject[] | null>(null);
  const [subjectId, setSubjectId] = useState("");
  const [themeId, setThemeId] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [subConceptId, setSubConceptId] = useState("");

  const [description, setDescription] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [tasks, setTasks] = useState<TaskDraft[]>([emptyTask()]);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Content creation is TUTOR-only (server enforces this too — see
    // RolesGuard on POST /sub-concepts/:id/content). Wait for the role fetch
    // before deciding, so a LEARNER isn't redirected on a stale null.
    if (appUserLoading) return;
    if (!canCreate(appUser?.role)) {
      router.replace("/");
      return;
    }
    apiFetch("/sub-concepts/tree")
      .then((res) => (res.ok ? (res.json() as Promise<TreeSubject[]>) : Promise.reject()))
      .then(setTree)
      .catch(() => {
        // Setting tree here breaks the loading guard on failure — otherwise
        // the page gets stuck on "Loading…" forever with no error visible.
        setTree([]);
        setError("Couldn't load the concept tree.");
      });
  }, [user, authLoading, appUser, appUserLoading, router]);

  const themes = useMemo(() => tree?.find((s) => s.id === subjectId)?.themes ?? [], [tree, subjectId]);
  const concepts = useMemo(() => themes.find((t) => t.id === themeId)?.concepts ?? [], [themes, themeId]);
  const subConcepts = useMemo(
    () => concepts.find((c) => c.id === conceptId)?.subConcepts ?? [],
    [concepts, conceptId],
  );

  const handleUpload = async (file: File, slot: "video" | "preview") => {
    setError(null);
    const setProgress = slot === "video" ? setVideoProgress : setPreviewProgress;
    const setUrl = slot === "video" ? setVideoUrl : setPreviewVideoUrl;

    if (slot === "preview") {
      try {
        const duration = await getVideoDuration(file);
        if (duration > PREVIEW_MAX_SECONDS) {
          setError(`Preview video must be ${PREVIEW_MAX_SECONDS}s or shorter — this one is ${Math.round(duration)}s.`);
          return;
        }
      } catch {
        setError("Couldn't read the preview video's length — try a different file.");
        return;
      }
    }

    setProgress(0);
    try {
      const url = await uploadVideo(file, slot === "video" ? "main" : "preview", setProgress);
      setUrl(url);
    } catch {
      setError(`Couldn't upload the ${slot} video.`);
      setProgress(null);
    }
  };

  const updateTask = (index: number, patch: Partial<TaskDraft>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!subConceptId) return setError("Choose a Sub-concept.");
    if (!videoUrl) return setError("Upload the main video first.");
    if (!previewVideoUrl) return setError("Upload a preview video (up to 45s).");

    const cleanTasks = tasks
      .map((t) => ({
        type: t.type,
        prompt: t.prompt.trim(),
        choices: t.choicesText.trim() ? t.choicesText.split(",").map((c) => c.trim()) : undefined,
        answer: t.answer.trim(),
        isSolvedOnScreen: t.isSolvedOnScreen,
      }))
      .filter((t) => t.prompt && t.answer);

    setSubmitting(true);
    try {
      const res = await apiFetch(`/sub-concepts/${subConceptId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video: videoUrl,
          previewVideo: previewVideoUrl,
          description: description.trim() || undefined,
          creatorName: creatorName.trim() || undefined,
          tasks: cleanTasks.length ? cleanTasks : undefined,
        }),
      });
      if (!res.ok) {
        const body: { message?: string } = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to add content.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add content.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !tree) {
    return <div className="skeleton">Loading…</div>;
  }

  if (success) {
    return (
      <div className="page-shell">
        <div className={`card ${styles.successCard}`}>
          <span className={styles.successIcon}>✓</span>
          <p className={styles.successText}>Content added to the Sub-concept.</p>
          <div className={styles.successActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setDescription("");
                setCreatorName("");
                setTasks([emptyTask()]);
                setVideoUrl(null);
                setVideoProgress(null);
                setPreviewVideoUrl(null);
                setPreviewProgress(null);
                setSuccess(false);
              }}
            >
              Add another
            </button>
            <Link href="/" className="btn btn-secondary">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className={styles.title}>Add content</h1>
        <p className={`text-secondary ${styles.subtitle}`}>
          Pick an existing Sub-concept and contribute your own explanation of it — video, an optional
          preview clip, a description, and your own practice tasks. The tree itself (Subjects, Themes,
          Concepts, Sub-concepts) is fixed; this is the only thing you can add.
        </p>
      </div>

      <div className={`card ${styles.formCard}`}>
        <div className={styles.pickerGrid}>
          <label className="field-label">
            Subject
            <select
              className="input"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setThemeId("");
                setConceptId("");
                setSubConceptId("");
              }}
            >
              <option value="">Choose…</option>
              {tree.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Theme
            <select
              className="input"
              value={themeId}
              onChange={(e) => {
                setThemeId(e.target.value);
                setConceptId("");
                setSubConceptId("");
              }}
              disabled={!subjectId}
            >
              <option value="">Choose…</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Concept
            <select
              className="input"
              value={conceptId}
              onChange={(e) => {
                setConceptId(e.target.value);
                setSubConceptId("");
              }}
              disabled={!themeId}
            >
              <option value="">Choose…</option>
              {concepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            Sub-concept
            <select className="input" value={subConceptId} onChange={(e) => setSubConceptId(e.target.value)} disabled={!conceptId}>
              <option value="">Choose…</option>
              {subConcepts.map((subConcept) => (
                <option key={subConcept.id} value={subConcept.id}>
                  {subConcept.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field-label">
          Your name (optional)
          <input
            className="input"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="e.g. Jane Doe"
          />
        </label>

        <label className="field-label">
          Description (optional)
          <textarea
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this matters / what this video covers"
            rows={3}
          />
        </label>

        <div className={styles.uploadGrid}>
          <div className={styles.uploadField}>
            <span className="field-label">Main video (required)</span>
            <input
              className={styles.fileInput}
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && void handleUpload(e.target.files[0], "video")}
            />
            {videoProgress !== null && videoProgress < 100 && (
              <p className={styles.progress}>Uploading… {videoProgress}%</p>
            )}
            {videoUrl && <p className={styles.uploaded}>Uploaded ✓</p>}
          </div>

          <div className={styles.uploadField}>
            <span className="field-label">Preview video (required, up to 45s)</span>
            <input
              className={styles.fileInput}
              type="file"
              accept="video/*"
              onChange={(e) => e.target.files?.[0] && void handleUpload(e.target.files[0], "preview")}
            />
            {previewProgress !== null && previewProgress < 100 && (
              <p className={styles.progress}>Uploading… {previewProgress}%</p>
            )}
            {previewVideoUrl && <p className={styles.uploaded}>Uploaded ✓</p>}
          </div>
        </div>

        <section className={styles.tasksSection}>
          <h2 className={styles.sectionTitle}>Tasks (optional)</h2>
          <p className={`text-secondary ${styles.tasksHint}`}>
            Every task here starts as a homework task — what learners see on the practice step. Mark a task
            &ldquo;Solved on-screen&rdquo; only if it&rsquo;s a duplicate of something you actually work out in
            the video — those are never the starting task, they&rsquo;re only reached when a learner rolls
            because they&rsquo;re stuck, so they can rewatch and see it solved.
          </p>
          {tasks.map((task, index) => (
            <div key={index} className={styles.taskCard}>
              <div className={styles.taskRow}>
                <select
                  className="input"
                  value={task.type}
                  onChange={(e) => updateTask(index, { type: e.target.value as TaskType })}
                >
                  <option value="MULTIPLE_CHOICE">Multiple choice</option>
                  <option value="FILL_GAP">Fill the gap</option>
                  <option value="CALCULATION">Calculation</option>
                  <option value="CODE_CHALLENGE">Code challenge</option>
                </select>
                <input
                  className="input"
                  placeholder="Prompt"
                  value={task.prompt}
                  onChange={(e) => updateTask(index, { prompt: e.target.value })}
                />
                {task.type === "MULTIPLE_CHOICE" && (
                  <input
                    className="input"
                    placeholder="Choices, comma-separated"
                    value={task.choicesText}
                    onChange={(e) => updateTask(index, { choicesText: e.target.value })}
                  />
                )}
                <input
                  className="input"
                  placeholder="Correct answer"
                  value={task.answer}
                  onChange={(e) => updateTask(index, { answer: e.target.value })}
                />
              </div>
              <div className={styles.taskMeta}>
                <label className={styles.homeworkToggle}>
                  <input
                    type="checkbox"
                    checked={task.isSolvedOnScreen}
                    onChange={(e) => updateTask(index, { isSolvedOnScreen: e.target.checked })}
                  />
                  Solved on-screen in the video
                </label>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => setTasks((prev) => prev.filter((_, i) => i !== index))}
                  disabled={tasks.length === 1}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setTasks((prev) => [...prev, emptyTask()])}>
            + Add task
          </button>
        </section>

        <button type="button" className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? "Adding…" : "Add content"}
        </button>

        {error && <p className="text-danger">{error}</p>}
      </div>
    </div>
  );
}
