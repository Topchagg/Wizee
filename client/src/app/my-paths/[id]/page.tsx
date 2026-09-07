"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { canCreate, useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { PrereqSuggestionModal } from "./_components/PrereqSuggestionModal";
import { Roadmap } from "./_components/Roadmap";
import { TreePicker } from "./_components/TreePicker";
import type { MissingPrerequisite, PathDetail, SearchHit, TreeSubject } from "./_components/types";
import styles from "./page.module.css";

export default function PathBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, appUser, appUserLoading } = useAuth();
  const router = useRouter();

  const [detail, setDetail] = useState<PathDetail | null>(null);
  const [tree, setTree] = useState<TreeSubject[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [prereqSuggestion, setPrereqSuggestion] = useState<MissingPrerequisite[] | null>(null);

  const loadDetail = () => {
    apiFetch(`/paths/${id}`)
      .then((res) => (res.ok ? (res.json() as Promise<PathDetail>) : Promise.reject()))
      .then(setDetail)
      .catch(() => setError("Couldn't load this path."));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Path editing is TUTOR-only (server enforces this too — see RolesGuard
    // on the path mutation routes). Wait for the role fetch before deciding.
    if (appUserLoading) return;
    if (!canCreate(appUser?.role)) {
      router.replace("/");
      return;
    }
    loadDetail();
    apiFetch("/paths/tree")
      .then((res) => (res.ok ? (res.json() as Promise<TreeSubject[]>) : Promise.reject()))
      .then(setTree)
      .catch(() => setError("Couldn't load the concept tree."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, authLoading, appUser, appUserLoading, router]);

  // Debounced, scoped to whichever Subject is currently open.
  useEffect(() => {
    if (!selectedSubjectId || !query.trim()) {
      // Deferred a microtask so this reset isn't a synchronous setState call
      // in the effect body.
      void Promise.resolve().then(() => {
        setSearchResults(null);
        setSearching(false);
      });
      return;
    }
    void Promise.resolve().then(() => setSearching(true));
    const handle = setTimeout(() => {
      apiFetch(`/paths/search?subjectId=${selectedSubjectId}&q=${encodeURIComponent(query.trim())}`)
        .then((res) => (res.ok ? (res.json() as Promise<SearchHit[]>) : Promise.reject()))
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [selectedSubjectId, query]);

  const handleAdd = async (itemType: "THEME" | "CONCEPT", themeId?: string, conceptId?: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/paths/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, themeId, conceptId }),
      });
      if (!res.ok) throw new Error();
      // Suggestion only, never blocking — the server returns the newly added
      // Concept's full prerequisite chain, minus whatever the path already
      // covers. Doesn't apply to THEME items (a Theme already covers every
      // Concept under it, so it has nothing to suggest against).
      if (itemType === "CONCEPT") {
        const body: { missingPrerequisites?: MissingPrerequisite[] } = await res.json().catch(() => ({}));
        setPrereqSuggestion(body.missingPrerequisites && body.missingPrerequisites.length > 0 ? body.missingPrerequisites : null);
      }
      loadDetail();
    } catch {
      setError("Couldn't add that item.");
    } finally {
      setBusy(false);
    }
  };

  // Adding an item from the suggestion list itself. Its own chain was already
  // included in the ORIGINAL suggestion (that came from the full transitive
  // closure — see PathsService.getMissingPrerequisites), so nothing further
  // can be revealed here; just drop it from the list once added.
  const addSuggestedPrerequisite = async (conceptId: string) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/paths/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType: "CONCEPT", conceptId }),
      });
      if (!res.ok) throw new Error();
      setPrereqSuggestion((prev) => {
        const remaining = prev?.filter((p) => p.id !== conceptId) ?? null;
        return remaining && remaining.length > 0 ? remaining : null;
      });
      loadDetail();
    } catch {
      setError("Couldn't add that prerequisite.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    setBusy(true);
    try {
      await apiFetch(`/paths/${id}/items/${itemId}`, { method: "DELETE" });
      loadDetail();
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!detail) return;
    const target = index + direction;
    if (target < 0 || target >= detail.items.length) return;

    const reordered = [...detail.items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setBusy(true);
    try {
      const res = await apiFetch(`/paths/${id}/items/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: reordered.map((item) => item.id) }),
      });
      if (!res.ok) throw new Error();
      loadDetail();
    } catch {
      setError("Couldn't reorder items.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch(`/paths/${id}/publish`, { method: "POST" });
      if (!res.ok) {
        const body: { message?: string } = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Publish failed");
      }
      loadDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't publish this path.");
    } finally {
      setBusy(false);
    }
  };

  const openSubject = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setExpandedThemes(new Set());
    setExpandedConcepts(new Set());
    setQuery("");
    setSearchResults(null);
  };

  const closeSubject = () => {
    setSelectedSubjectId(null);
    setQuery("");
    setSearchResults(null);
  };

  if (authLoading) {
    return <div className="skeleton">Loading…</div>;
  }

  // If either fetch failed before ever succeeding once, `detail`/`tree` stay
  // null forever — without this branch the page got stuck on the spinner
  // above instead of ever showing `error`.
  if (error && (!detail || !tree)) {
    return (
      <div className="page-shell">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!detail || !tree) {
    return <div className="skeleton">Loading…</div>;
  }

  const addedThemeIds = new Set(detail.items.filter((i) => i.itemType === "THEME").map((i) => i.themeId));
  const addedConceptIds = new Set(detail.items.filter((i) => i.itemType === "CONCEPT").map((i) => i.conceptId));
  const selectedSubject = tree.find((s) => s.id === selectedSubjectId) ?? null;

  return (
    <div className={styles.builderShell}>
      <Link href="/my-paths" className={styles.back}>
        ← My paths
      </Link>

      <div className={styles.headerRow}>
        <h1 className={styles.title}>{detail.title}</h1>
        <span className={detail.isPublic ? "badge badge-success" : "badge"}>{detail.isPublic ? "Published" : "Draft"}</span>
      </div>
      {detail.description && <p className={`text-secondary ${styles.pathDescription}`}>{detail.description}</p>}

      <div className={styles.builderGrid}>
        <Roadmap
          items={detail.items}
          busy={busy}
          isPublic={detail.isPublic}
          onMove={(index, direction) => void handleMove(index, direction)}
          onRemove={(itemId) => void handleRemove(itemId)}
          onPublish={() => void handlePublish()}
        />

        <TreePicker
          tree={tree}
          selectedSubject={selectedSubject}
          onOpenSubject={openSubject}
          onCloseSubject={closeSubject}
          query={query}
          onQueryChange={setQuery}
          searching={searching}
          searchResults={searchResults}
          expandedThemes={expandedThemes}
          onExpandedThemesChange={setExpandedThemes}
          expandedConcepts={expandedConcepts}
          onExpandedConceptsChange={setExpandedConcepts}
          addedThemeIds={addedThemeIds}
          addedConceptIds={addedConceptIds}
          busy={busy}
          onAdd={(itemType, themeId, conceptId) => void handleAdd(itemType, themeId, conceptId)}
        />
      </div>

      {error && <p className="text-danger">{error}</p>}

      {prereqSuggestion && (
        <PrereqSuggestionModal
          suggestions={prereqSuggestion}
          busy={busy}
          onAdd={(conceptId) => void addSuggestedPrerequisite(conceptId)}
          onClose={() => setPrereqSuggestion(null)}
        />
      )}
    </div>
  );
}
