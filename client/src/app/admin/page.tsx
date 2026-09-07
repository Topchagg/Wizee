"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toggleSetMember } from "@/lib/set-utils";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { PrerequisitesModal } from "./_components/PrerequisitesModal";
import { SuggestionsPanel } from "./_components/SuggestionsPanel";
import { TreeView } from "./_components/TreeView";
import { AddChildForm } from "./_components/AddChildForm";
import { extractErrorMessage } from "./_components/types";
import type {
  FlatConcept,
  PendingDelete,
  PrereqConcept,
  Suggestion,
  TreeActions,
  TreeConcept,
  TreeSubConcept,
  TreeSubject,
  TreeTheme,
} from "./_components/types";
import styles from "./page.module.css";

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
  // confirmation step opens a modal rather than a native confirm(), so it
  // matches the rest of the app's dialogs.
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

  const actions: TreeActions = {
    expandedSubjects,
    expandedThemes,
    expandedConcepts,
    onToggleSubject: (id) => setExpandedSubjects((prev) => toggleSetMember(prev, id)),
    onToggleTheme: (id) => setExpandedThemes((prev) => toggleSetMember(prev, id)),
    onToggleConcept: (id) => setExpandedConcepts((prev) => toggleSetMember(prev, id)),
    onCreateTheme: (subjectId, title) => create("/admin/themes", { subjectId, title }),
    onCreateConcept: (themeId, title) => create("/admin/concepts", { themeId, title }),
    onCreateSubConcept: (conceptId, title) => create("/admin/sub-concepts", { conceptId, title }),
    onDeleteSubject: (subject: TreeSubject) => remove(`/admin/subjects/${subject.id}`, "Theme/Concept/Sub-concept", subject.title),
    onDeleteTheme: (theme: TreeTheme) => remove(`/admin/themes/${theme.id}`, "Concept/Sub-concept", theme.title),
    onDeleteConcept: (concept: TreeConcept) => remove(`/admin/concepts/${concept.id}`, "Sub-concept", concept.title),
    onDeleteSubConcept: (sc: TreeSubConcept) => remove(`/admin/sub-concepts/${sc.id}`, "video/task", sc.title),
    onOpenPrereqs: openPrerequisites,
  };

  return (
    <div className="page-shell">
      <div>
        <h1 className={styles.title}>Manage the tree</h1>
        <p className="text-secondary">
          Subject → Theme → Concept → Sub-concept. This grows the curated tree shape — filling it with actual
          video content still happens on <code>/add-content</code>.
        </p>
      </div>

      {suggestions !== null && (
        <SuggestionsPanel suggestions={suggestions} workingSuggestionId={workingSuggestionId} onDecide={(id, action) => void decideSuggestion(id, action)} />
      )}

      <div className={`card ${styles.addRowCard}`}>
        <AddChildForm placeholder="New Subject title" onSubmit={(title) => create("/admin/subjects", { title })} />
      </div>

      {error && <p className="text-danger">{error}</p>}

      <TreeView tree={tree} actions={actions} />

      {pendingDelete && (
        <DeleteConfirmModal
          pendingDelete={pendingDelete}
          deleting={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}

      {prereqTarget && (
        <PrerequisitesModal
          conceptTitle={prereqTarget.conceptTitle}
          prereqList={prereqList}
          candidates={prereqCandidates}
          query={prereqQuery}
          onQueryChange={setPrereqQuery}
          busyId={prereqBusyId}
          error={prereqError}
          onAdd={(id) => void addPrerequisite(id)}
          onRemove={(id) => void removePrerequisite(id)}
          onClose={() => setPrereqTarget(null)}
        />
      )}
    </div>
  );
}
