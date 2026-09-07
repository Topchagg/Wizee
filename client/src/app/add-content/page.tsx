"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { canCreate, useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { getVideoDuration, uploadVideo } from "@/lib/upload";
import { SubConceptPicker } from "./_components/SubConceptPicker";
import { SuccessCard } from "./_components/SuccessCard";
import { TasksSection } from "./_components/TasksSection";
import { emptyTask, PREVIEW_MAX_SECONDS } from "./_components/types";
import type { TaskDraft, TreeSubject } from "./_components/types";
import { VideoUploadField } from "./_components/VideoUploadField";
import styles from "./page.module.css";

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
  const subConcepts = useMemo(() => concepts.find((c) => c.id === conceptId)?.subConcepts ?? [], [concepts, conceptId]);

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
      <SuccessCard
        onAddAnother={() => {
          setDescription("");
          setCreatorName("");
          setTasks([emptyTask()]);
          setVideoUrl(null);
          setVideoProgress(null);
          setPreviewVideoUrl(null);
          setPreviewProgress(null);
          setSuccess(false);
        }}
      />
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
        <SubConceptPicker
          tree={tree}
          subjectId={subjectId}
          onSubjectChange={(id) => {
            setSubjectId(id);
            setThemeId("");
            setConceptId("");
            setSubConceptId("");
          }}
          themeId={themeId}
          onThemeChange={(id) => {
            setThemeId(id);
            setConceptId("");
            setSubConceptId("");
          }}
          themes={themes}
          conceptId={conceptId}
          onConceptChange={(id) => {
            setConceptId(id);
            setSubConceptId("");
          }}
          concepts={concepts}
          subConceptId={subConceptId}
          onSubConceptChange={setSubConceptId}
          subConcepts={subConcepts}
        />

        <label className="field-label">
          Your name (optional)
          <input className="input" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="e.g. Jane Doe" />
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
          <VideoUploadField
            label="Main video (required)"
            uploadedUrl={videoUrl}
            progress={videoProgress}
            onFile={(file) => void handleUpload(file, "video")}
          />
          <VideoUploadField
            label="Preview video (required, up to 45s)"
            uploadedUrl={previewVideoUrl}
            progress={previewProgress}
            onFile={(file) => void handleUpload(file, "preview")}
          />
        </div>

        <TasksSection
          tasks={tasks}
          onUpdate={updateTask}
          onRemove={(index) => setTasks((prev) => prev.filter((_, i) => i !== index))}
          onAdd={() => setTasks((prev) => [...prev, emptyTask()])}
        />

        <button type="button" className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? "Adding…" : "Add content"}
        </button>

        {error && <p className="text-danger">{error}</p>}
      </div>
    </div>
  );
}
