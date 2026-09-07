"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/Modal";
import { apiFetch } from "@/lib/api";
import { toggleSetMember } from "@/lib/set-utils";
import styles from "./page.module.css";

type TreeSubConcept = { id: string; title: string; slug: string };
type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
type TreeSubject = { id: string; title: string; slug: string; themes: TreeTheme[] };

type PendingDelete = { path: string; kind: string; title: string };

type Suggestion = {
  id: string;
  type: "THEME" | "CONCEPT" | "SUBCONCEPT";
  title: string;
  createdAt: string;
  subject: { title: string } | null;
  theme: { title: string; subject: { title: string } } | null;
  concept: { title: string; theme: { title: string; subject: { title: string } } } | null;
  suggestedBy: { displayName: string | null; email: string };
};

// "Suggest a Theme" targets a Subject directly; "Suggest a Concept"/"a
// Sub-concept" target a Theme/Concept, which each carry their own ancestor
// chain — this just reads whichever branch is non-null into one label.
function suggestionContext(s: Suggestion): string {
  if (s.subject) return s.subject.title;
  if (s.theme) return `${s.theme.subject.title} → ${s.theme.title}`;
  if (s.concept) return `${s.concept.theme.subject.title} → ${s.concept.theme.title} → ${s.concept.title}`;
  return "—";
}

const SUGGESTION_KIND_LABEL: Record<Suggestion["type"], string> = {
  THEME: "Theme",
  CONCEPT: "Concept",
  SUBCONCEPT: "Sub-concept",
};

type PrereqConcept = { id: string; title: string; themeTitle: string };
type FlatConcept = { id: string; title: string; themeTitle: string; subjectTitle: string };

function extractErrorMessage(body: { message?: string | string[] }, fallback: string): string {
  if (Array.isArray(body.message)) return body.message[0] ?? fallback;
  return body.message ?? fallback;
}

// Every "add" row is a self-contained form — it owns its own input text and
// submitting state, so the tree above doesn't need a title/loading slot per
// node in the whole structure just to support typing into one at a time.
function AddChildForm({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(title.trim());
      setTitle("");
    } catch {
      setError("Couldn't add that.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.addRow}>
      <input
        className="input"
        placeholder={placeholder}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
        disabled={submitting}
      />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => void handleSubmit()}
        disabled={submitting || !title.trim()}
      >
        {submitting ? "Adding…" : "+ Add"}
      </button>
      {error && <span className={styles.addError}>{error}</span>}
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading, appUser, appUserLoading } = useAuth();
  const router = useRouter();

  const [tree, setTree] = useState<TreeSubject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [workingSuggestionId, setWorkingSuggestionId] = useState<string | null>(null);
  const [prereqTarget, setPrereqTarget] = useState<{ conceptId: string; conceptTitle: string } | null>(null);
  const [prereqList, setPrereqList] = useState<PrereqConcept[] | null>(null);
  const [prereqQuery, setPrereqQuery] = useState("");
  const [prereqBusyId, setPrereqBusyId] = useState<string | null>(null);
  const [prereqError, setPrereqError] = useState<string | null>(null);

  const load = () => {
    apiFetch("/sub-concepts/tree")
      .then((res) => (res.ok ? (res.json() as Promise<TreeSubject[]>) : Promise.reject()))
      .then(setTree)
      .catch(() => {
        // Setting tree here breaks the loading guard on failure — otherwise
        // the page gets stuck on "Loading…" forever with no error visible.
        setTree([]);
        setError("Couldn't load the tree.");
      });
  };

  const loadSuggestions = () => {
    apiFetch("/suggestions")
      .then((res) => (res.ok ? (res.json() as Promise<Suggestion[]>) : Promise.reject()))
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Tree curation is SUPERADMIN-only — unlike path/content creation
    // (canCreate), a plain TUTOR does NOT get this. Wait for the role fetch
    // before deciding, so nobody is redirected on a stale null.
    if (appUserLoading) return;
    if (appUser?.role !== "SUPERADMIN") {
      router.replace("/");
      return;
    }
    load();
    loadSuggestions();
  }, [user, authLoading, appUser, appUserLoading, router]);

  // Approving creates the real tree node (via the server's AdminService) and
  // clears the suggestion in one call — the tree can gain a new Theme/
  // Concept/Sub-concept, so both lists need refreshing.
  const decideSuggestion = async (id: string, action: "approve" | "reject") => {
    setWorkingSuggestionId(id);
    setError(null);
    try {
      const res = await apiFetch(`/suggestions/${id}${action === "approve" ? "/approve" : ""}`, {
        method: action === "approve" ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error();
      loadSuggestions();
      if (action === "approve") load();
    } catch {
      setError(`Couldn't ${action} that suggestion.`);
    } finally {
      setWorkingSuggestionId(null);
    }
  };

  // Prerequisites are Concept-only — never Sub-concept, never Theme (see
  // server/src/prerequisites/prerequisites.service.ts). Set manually here by
  // whoever is curating the tree; the Path builder and learner UI only ever
  // read this graph, never write it.
  const loadPrerequisites = (conceptId: string) => {
    apiFetch(`/concepts/${conceptId}/prerequisites`)
      .then((res) => (res.ok ? (res.json() as Promise<PrereqConcept[]>) : Promise.reject()))
      .then(setPrereqList)
      .catch(() => setPrereqList([]));
  };

  const openPrerequisites = (conceptId: string, conceptTitle: string) => {
    setPrereqTarget({ conceptId, conceptTitle });
    setPrereqQuery("");
    setPrereqError(null);
    setPrereqList(null);
    loadPrerequisites(conceptId);
  };

  const addPrerequisite = async (requiresConceptId: string) => {
    if (!prereqTarget) return;
    setPrereqBusyId(requiresConceptId);
    setPrereqError(null);
    try {
      const res = await apiFetch(`/concepts/${prereqTarget.conceptId}/prerequisites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiresConceptId }),
      });
      if (!res.ok) {
        const body: { message?: string | string[] } = await res.json().catch(() => ({}));
        throw new Error(extractErrorMessage(body, "Couldn't add that prerequisite."));
      }
      loadPrerequisites(prereqTarget.conceptId);
    } catch (err) {
      setPrereqError(err instanceof Error ? err.message : "Couldn't add that prerequisite.");
    } finally {
      setPrereqBusyId(null);
    }
  };

  const removePrerequisite = async (requiresConceptId: string) => {
    if (!prereqTarget) return;
    setPrereqBusyId(requiresConceptId);
    setPrereqError(null);
    try {
      const res = await apiFetch(`/concepts/${prereqTarget.conceptId}/prerequisites/${requiresConceptId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setPrereqList((prev) => prev?.filter((p) => p.id !== requiresConceptId) ?? null);
    } catch {
      setPrereqError("Couldn't remove that prerequisite.");
    } finally {
      setPrereqBusyId(null);
    }
  };

  const create = async (path: string, body: Record<string, string>) => {
    const res = await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    load();
  };

  // Deletion cascades all the way down (see AdminService server-side) — the
  // confirmation step opens the shared Modal below rather than a native
  // confirm(), so it matches the rest of the app's dialogs.
  const remove = (path: string, kind: string, title: string) => {
    setPendingDelete({ path, kind, title });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch(pendingDelete.path, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPendingDelete(null);
      load();
    } catch {
      setError(`Couldn't delete "${pendingDelete.title}".`);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading || appUserLoading || appUser?.role !== "SUPERADMIN" || !tree) {
    return <div className="skeleton">Loading…</div>;
  }

  const flatConcepts: FlatConcept[] = tree.flatMap((subject) =>
    subject.themes.flatMap((theme) =>
      theme.concepts.map((concept) => ({
        id: concept.id,
        title: concept.title,
        themeTitle: theme.title,
        subjectTitle: subject.title,
      })),
    ),
  );
  const prereqIds = new Set(prereqList?.map((p) => p.id));
  const prereqCandidates = prereqQuery.trim()
    ? flatConcepts
        .filter((c) => c.id !== prereqTarget?.conceptId && !prereqIds.has(c.id))
        .filter((c) => c.title.toLowerCase().includes(prereqQuery.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  return (
    <div className="page-shell">
      <div>
        <h1 className={styles.title}>Manage the tree</h1>
        <p className="text-secondary">
          Subject → Theme → Concept → Sub-concept. This grows the curated tree shape — filling it with actual
          video content still happens on <code>/add-content</code>.
        </p>
      </div>

      {suggestions !== null && suggestions.length > 0 && (
        <div className={`card ${styles.suggestionsCard}`}>
          <h2 className={styles.suggestionsTitle}>
            Suggestions <span className="badge">{suggestions.length}</span>
          </h2>
          <ul className={styles.suggestionsList}>
            {suggestions.map((s) => (
              <li key={s.id} className={styles.suggestionRow}>
                <div className={styles.suggestionInfo}>
                  <span className="badge">{SUGGESTION_KIND_LABEL[s.type]}</span>
                  <span className={styles.suggestionTitle}>{s.title}</span>
                  <span className={styles.suggestionContext}>under {suggestionContext(s)}</span>
                  <span className={styles.suggestionBy}>
                    — suggested by {s.suggestedBy.displayName ?? s.suggestedBy.email}
                  </span>
                </div>
                <div className={styles.suggestionActions}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => void decideSuggestion(s.id, "reject")}
                    disabled={workingSuggestionId === s.id}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => void decideSuggestion(s.id, "approve")}
                    disabled={workingSuggestionId === s.id}
                  >
                    {workingSuggestionId === s.id ? "Working…" : "Approve"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`card ${styles.addRowCard}`}>
        <AddChildForm placeholder="New Subject title" onSubmit={(title) => create("/admin/subjects", { title })} />
      </div>

      {error && <p className="text-danger">{error}</p>}

      <div className={`card ${styles.tree}`}>
        {tree.length === 0 && <p className="text-secondary">No Subjects yet — add one above.</p>}
        {tree.map((subject) => {
          const subjectOpen = expandedSubjects.has(subject.id);
          return (
            <div key={subject.id} className={styles.subjectBlock}>
              <div className={styles.rowShell}>
                <button
                  type="button"
                  className={styles.subjectRow}
                  onClick={() => setExpandedSubjects((prev) => toggleSetMember(prev, subject.id))}
                >
                  <span className={subjectOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                  <span className={styles.subjectTitle}>{subject.title}</span>
                  <span className="badge">{subject.themes.length} {subject.themes.length === 1 ? "theme" : "themes"}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => remove(`/admin/subjects/${subject.id}`, "Theme/Concept/Sub-concept", subject.title)}
                >
                  Delete
                </button>
              </div>

              {subjectOpen && (
                <div className={styles.nested}>
                  <AddChildForm
                    placeholder="New Theme title"
                    onSubmit={(title) => create("/admin/themes", { subjectId: subject.id, title })}
                  />
                  {subject.themes.map((theme) => {
                    const themeOpen = expandedThemes.has(theme.id);
                    return (
                      <div key={theme.id} className={styles.themeBlock}>
                        <div className={styles.rowShell}>
                          <button
                            type="button"
                            className={styles.themeRow}
                            onClick={() => setExpandedThemes((prev) => toggleSetMember(prev, theme.id))}
                          >
                            <span className={themeOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                            <span className={styles.themeTitle}>{theme.title}</span>
                            <span className="badge">
                              {theme.concepts.length} {theme.concepts.length === 1 ? "concept" : "concepts"}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => remove(`/admin/themes/${theme.id}`, "Concept/Sub-concept", theme.title)}
                          >
                            Delete
                          </button>
                        </div>

                        {themeOpen && (
                          <div className={styles.nested}>
                            <AddChildForm
                              placeholder="New Concept title"
                              onSubmit={(title) => create("/admin/concepts", { themeId: theme.id, title })}
                            />
                            {theme.concepts.map((concept) => {
                              const conceptOpen = expandedConcepts.has(concept.id);
                              return (
                                <div key={concept.id} className={styles.conceptBlock}>
                                  <div className={styles.rowShell}>
                                    <button
                                      type="button"
                                      className={styles.conceptRow}
                                      onClick={() => setExpandedConcepts((prev) => toggleSetMember(prev, concept.id))}
                                    >
                                      <span className={conceptOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                                      <span className={styles.conceptTitle}>{concept.title}</span>
                                      <span className="badge">{concept.subConcepts.length} sub-concepts</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => openPrerequisites(concept.id, concept.title)}
                                    >
                                      Prereqs
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => remove(`/admin/concepts/${concept.id}`, "Sub-concept", concept.title)}
                                    >
                                      Delete
                                    </button>
                                  </div>

                                  {conceptOpen && (
                                    <div className={styles.nested}>
                                      <AddChildForm
                                        placeholder="New Sub-concept title"
                                        onSubmit={(title) => create("/admin/sub-concepts", { conceptId: concept.id, title })}
                                      />
                                      {concept.subConcepts.length === 0 ? (
                                        <p className={styles.emptyHint}>No Sub-concepts yet.</p>
                                      ) : (
                                        <ul className={styles.subConceptList}>
                                          {concept.subConcepts.map((sc) => (
                                            <li key={sc.id} className={styles.subConceptRow}>
                                              <span className={styles.dot} />
                                              <span className={styles.subConceptTitle}>{sc.title}</span>
                                              <span className={styles.subConceptSlug}>{sc.slug}</span>
                                              <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => remove(`/admin/sub-concepts/${sc.id}`, "video/task", sc.title)}
                                              >
                                                Delete
                                              </button>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pendingDelete && (
        <Modal
          title={`Delete "${pendingDelete.title}"?`}
          onClose={() => !deleting && setPendingDelete(null)}
          actions={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          This also deletes every {pendingDelete.kind} nested under it — this can&rsquo;t be undone.
        </Modal>
      )}

      {prereqTarget && (
        <Modal
          title={`Prerequisites for "${prereqTarget.conceptTitle}"`}
          onClose={() => setPrereqTarget(null)}
          actions={
            <button type="button" className="btn btn-primary" onClick={() => setPrereqTarget(null)}>
              Done
            </button>
          }
        >
          <p className={styles.prereqHint}>
            Concepts a learner should already know before this one — may live in any Theme, including a different one.
          </p>

          {prereqList === null ? (
            <p className="text-secondary">Loading…</p>
          ) : prereqList.length === 0 ? (
            <p className="text-secondary">No prerequisites set yet.</p>
          ) : (
            <ul className={styles.prereqList}>
              {prereqList.map((p) => (
                <li key={p.id} className={styles.prereqRow}>
                  <span className={styles.prereqTitle}>{p.title}</span>
                  <span className={styles.prereqTheme}>{p.themeTitle}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void removePrerequisite(p.id)}
                    disabled={prereqBusyId === p.id}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            className={`input ${styles.prereqSearchInput}`}
            placeholder="Search Concepts to add as a prerequisite…"
            value={prereqQuery}
            onChange={(e) => setPrereqQuery(e.target.value)}
          />
          {prereqCandidates.length > 0 && (
            <ul className={styles.prereqList}>
              {prereqCandidates.map((c) => (
                <li key={c.id} className={styles.prereqRow}>
                  <span className={styles.prereqTitle}>{c.title}</span>
                  <span className={styles.prereqTheme}>
                    {c.subjectTitle} → {c.themeTitle}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => void addPrerequisite(c.id)}
                    disabled={prereqBusyId === c.id}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
          {prereqError && <p className={`text-danger ${styles.prereqError}`}>{prereqError}</p>}
        </Modal>
      )}
    </div>
  );
}
