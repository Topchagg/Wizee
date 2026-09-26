"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { canCreate, useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { getVideoDuration, uploadVideo } from "@/lib/upload";
import { SubConceptPicker } from "./_components/SubConceptPicker";
import { SuccessCard } from "./_components/SuccessCard";
import { TasksSection } from "./_components/TasksSection";
import { emptyTask, PREVIEW_MAX_SECONDS } from "./_components/types";
import type { SubConceptSearchHit, TaskDraft, TreeSubject } from "./_components/types";
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

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SubConceptSearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  // Set right before programmatically writing `query` to reflect a picked
  // Sub-concept's title (search hit or cascading select) — skips the one
  // debounced re-search that change would otherwise trigger, since we
  // already know the answer.
  const justPickedRef = useRef(false);

  const [description, setDescription] = useState("");
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

  // Debounced Sub-concept search — lets a tutor who already knows the slot's
  // name jump straight to it instead of walking the four cascading selects.
  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    if (!query.trim()) {
      void Promise.resolve().then(() => {
        setSearchResults(null);
        setSearching(false);
      });
      return;
    }
    void Promise.resolve().then(() => setSearching(true));
    const handle = setTimeout(() => {
      apiFetch(`/sub-concepts/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => (res.ok ? (res.json() as Promise<SubConceptSearchHit[]>) : Promise.reject()))
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const handlePickSearchHit = (hit: SubConceptSearchHit) => {
    setSubjectId(hit.subjectId);
    setThemeId(hit.themeId);
    setConceptId(hit.conceptId);
    setSubConceptId(hit.subConceptId);
    justPickedRef.current = true;
    setQuery(hit.name);
    setSearchResults(null);
  };

  const themes = useMemo(() => tree?.find((s) => s.id === subjectId)?.themes ?? [], [tree, subjectId]);
  const concepts = useMemo(() => themes.find((t) => t.id === themeId)?.concepts ?? [], [themes, themeId]);
  const subConcepts = useMemo(() => concepts.find((c) => c.id === conceptId)?.subConcepts ?? [], [concepts, conceptId]);

  // Picking straight from the cascading selects also fills the search box
  // with the result — same "show what's chosen" behavior as a search pick.
  const handleSubConceptSelect = (id: string) => {
    setSubConceptId(id);
    const picked = subConcepts.find((s) => s.id === id);
    justPickedRef.current = true;
    setQuery(picked?.title ?? "");
    setSearchResults(null);
  };

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

  const updateTask = (id: string, patch: Partial<TaskDraft>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!subConceptId) return setError("Choose a Sub-concept.");
    if (!videoUrl) return setError("Upload the main video first.");
    if (!previewVideoUrl) return setError("Upload a preview video (up to 45s).");

    const cleanTasks = tasks
      .map((t) => {
        const choices = t.choices.map((c) => c.trim()).filter(Boolean);
        // A single checked option submits as a bare string, same as any
        // other task type's answer — only 2+ correct options actually need
        // the array shape (that's also what flips the student UI to
        // checkboxes; see server's `multiCorrect`).
        const correct = Array.isArray(t.answer) ? t.answer.map((a) => a.trim()).filter(Boolean) : t.answer.trim();
        const answer = Array.isArray(correct) && correct.length === 1 ? correct[0] : correct;
        return {
          type: t.type,
          prompt: t.prompt.trim(),
          choices: choices.length ? choices : undefined,
          answer,
          isSolvedOnScreen: t.isSolvedOnScreen,
        };
      })
      .filter((t) => t.prompt && (Array.isArray(t.answer) ? t.answer.length > 0 : Boolean(t.answer)));

    // HW and SW are both mandatory — rolling needs a homework task to start
    // on and a solved-on-screen task to roll into (server enforces this
    // too; this just avoids a round trip for the common case).
    if (!cleanTasks.some((t) => !t.isSolvedOnScreen)) return setError("Add at least one HW task.");
    if (!cleanTasks.some((t) => t.isSolvedOnScreen)) return setError("Add at least one SW task.");

    setSubmitting(true);
    try {
      const res = await apiFetch(`/sub-concepts/${subConceptId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video: videoUrl,
          previewVideo: previewVideoUrl,
          description: description.trim() || undefined,
          tasks: cleanTasks,
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
    <div className={`page-shell ${styles.pageShellWide}`}>
      <div>
        <h1 className={styles.title}>Add content</h1>
        <p className={`text-secondary ${styles.subtitle}`}>
          Pick an existing Sub-concept and contribute your own explanation of it — a main video, a short
          preview clip, an optional description, and your own HW/SW practice tasks. The tree itself
          (Subjects, Themes, Concepts, Sub-concepts) is fixed; this is the only thing you can add.
        </p>
      </div>

      <div className={`card ${styles.formCard}`}>
        <SubConceptPicker
          tree={tree}
          query={query}
          onQueryChange={setQuery}
          searching={searching}
          searchResults={searchResults}
          onPickSearchHit={handlePickSearchHit}
          subjectId={subjectId}
          onSubjectChange={(id) => {
            setSubjectId(id);
            setThemeId("");
            setConceptId("");
            setSubConceptId("");
            setQuery("");
          }}
          themeId={themeId}
          onThemeChange={(id) => {
            setThemeId(id);
            setConceptId("");
            setSubConceptId("");
            setQuery("");
          }}
          themes={themes}
          conceptId={conceptId}
          onConceptChange={(id) => {
            setConceptId(id);
            setSubConceptId("");
            setQuery("");
          }}
          concepts={concepts}
          subConceptId={subConceptId}
          onSubConceptChange={handleSubConceptSelect}
          subConcepts={subConcepts}
        />

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
          onRemove={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
          onAdd={(isSolvedOnScreen) => setTasks((prev) => [...prev, emptyTask(isSolvedOnScreen)])}
        />

        <button type="button" className="btn btn-primary" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? "Adding…" : "Add content"}
        </button>

        {error && <p className="text-danger">{error}</p>}
      </div>
    </div>
  );
}
