"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type PathItem = {
  id: string;
  order: number;
  itemType: "THEME" | "CONCEPT";
  label: string;
  themeId: string | null;
  conceptId: string | null;
};
type PathDetail = { id: string; title: string; description: string | null; isPublic: boolean; items: PathItem[] };

type TreeSubConcept = { id: string; title: string };
type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
type TreeSubject = { id: string; title: string; themes: TreeTheme[] };

type SearchHit = {
  name: string;
  type: "THEME" | "CONCEPT" | "SUBCONCEPT";
  idLink: string;
  themeId: string | null;
  themeTitle: string | null;
  conceptId: string | null;
  conceptTitle: string | null;
};

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
}

export default function PathBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
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
    loadDetail();
    apiFetch("/paths/tree")
      .then((res) => (res.ok ? (res.json() as Promise<TreeSubject[]>) : Promise.reject()))
      .then(setTree)
      .catch(() => setError("Couldn't load the concept tree."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, authLoading, router]);

  // Debounced, scoped to whichever Subject is currently open.
  useEffect(() => {
    if (!selectedSubjectId || !query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
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
      loadDetail();
    } catch {
      setError("Couldn't add that item.");
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
        <span className={detail.isPublic ? "badge badge-success" : "badge"}>
          {detail.isPublic ? "Published" : "Draft"}
        </span>
      </div>
      {detail.description && <p className={`text-secondary ${styles.pathDescription}`}>{detail.description}</p>}

      <div className={styles.builderGrid}>
      <section className={`card ${styles.section} ${styles.pathSidebar}`}>
        <div>
          <h2 className={styles.sectionTitle}>Your path</h2>
          <p className={`text-secondary ${styles.pathSubtitle}`}>
            A learner following this path moves through these, top to bottom.
          </p>
        </div>

        {detail.items.length === 0 ? (
          <div className={styles.roadmap}>
            <div className={styles.roadmapNode}>
              <div className={styles.roadmapMarker}>
                <span className={styles.startMarker}>▶</span>
              </div>
              <p className={`text-secondary ${styles.emptyRoadmapHint}`}>
                Add a Theme or Concept below to lay the first step.
              </p>
            </div>
          </div>
        ) : (
          <ol className={`${styles.roadmap} ${styles.roadmapPopulated}`}>
            <li className={`${styles.roadmapNode} ${styles.startNode}`}>
              <div className={styles.roadmapMarker}>
                <span className={styles.startMarker}>▶</span>
              </div>
              <span className={styles.roadmapEndpointLabel}>Start</span>
            </li>
            {detail.items.map((item, index) => (
              <li key={item.id} className={styles.roadmapNode}>
                <div className={styles.roadmapMarker}>
                  <span className={styles.stepCircle}>{index + 1}</span>
                </div>
                <div className={styles.roadmapCard}>
                  <span className={styles.itemLabel}>
                    <span className="badge">{item.itemType}</span> {item.label}
                  </span>
                  <span className={styles.itemButtons}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => void handleMove(index, -1)}
                      disabled={busy || index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => void handleMove(index, 1)}
                      disabled={busy || index === detail.items.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => void handleRemove(item.id)}
                      disabled={busy}
                    >
                      Remove
                    </button>
                  </span>
                </div>
              </li>
            ))}
            <li className={styles.roadmapNode}>
              <div className={styles.roadmapMarker}>
                <span className={styles.goalMarker}>🏁</span>
              </div>
              <span className={styles.roadmapEndpointLabel}>Goal</span>
            </li>
          </ol>
        )}

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void handlePublish()}
          disabled={busy || detail.isPublic}
        >
          {detail.isPublic ? "Published" : "Publish"}
        </button>
      </section>

      <section className={`card ${styles.section} ${styles.treeSidebar}`}>
        <h2 className={styles.sectionTitle}>Add from the tree</h2>

        {!selectedSubject ? (
          <div className={styles.subjectGrid}>
            {tree.map((subject) => {
              const conceptCount = subject.themes.flatMap((t) => t.concepts).length;
              return (
                <button
                  key={subject.id}
                  type="button"
                  className={styles.subjectTile}
                  onClick={() => openSubject(subject.id)}
                >
                  <span className={styles.subjectTileTitle}>{subject.title}</span>
                  <span className={styles.subjectTileMeta}>
                    {subject.themes.length} {subject.themes.length === 1 ? "theme" : "themes"} · {conceptCount}{" "}
                    {conceptCount === 1 ? "concept" : "concepts"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.subjectPanel}>
            <div className={styles.subjectPanelHeader}>
              <button type="button" className={styles.backToSubjects} onClick={closeSubject}>
                ← All subjects
              </button>
              <span className={styles.subjectPanelTitle}>{selectedSubject.title}</span>
            </div>

            <input
              className="input"
              placeholder="Search themes, concepts, or sub-concepts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {query.trim() ? (
              <div className={styles.searchResults}>
                {searching && <p className="text-secondary">Searching…</p>}
                {!searching && searchResults?.length === 0 && <p className="text-secondary">No matches.</p>}
                {!searching &&
                  searchResults?.map((hit) => {
                    const themeIdToAdd = hit.type === "THEME" ? hit.idLink : hit.themeId;
                    const conceptIdToAdd = hit.type === "CONCEPT" ? hit.idLink : hit.type === "SUBCONCEPT" ? hit.conceptId : null;
                    return (
                      <div key={`${hit.type}-${hit.idLink}`} className={styles.searchHit}>
                        <div className={styles.searchHitInfo}>
                          <span className={`badge ${styles.hitTypeBadge}`}>{hit.type}</span>
                          <span className={styles.searchHitName}>{hit.name}</span>
                          {(hit.conceptTitle || hit.themeTitle) && (
                            <span className={styles.searchHitBreadcrumb}>
                              in {[hit.conceptTitle, hit.themeTitle].filter(Boolean).join(" › ")}
                            </span>
                          )}
                        </div>
                        <div className={styles.searchHitActions}>
                          {conceptIdToAdd && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => void handleAdd("CONCEPT", undefined, conceptIdToAdd)}
                              disabled={busy || addedConceptIds.has(conceptIdToAdd)}
                            >
                              {addedConceptIds.has(conceptIdToAdd)
                                ? "Concept added ✓"
                                : hit.type === "CONCEPT"
                                  ? "Add Concept"
                                  : `Add "${hit.conceptTitle}"`}
                            </button>
                          )}
                          {themeIdToAdd && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => void handleAdd("THEME", themeIdToAdd)}
                              disabled={busy || addedThemeIds.has(themeIdToAdd)}
                            >
                              {addedThemeIds.has(themeIdToAdd)
                                ? "Theme added ✓"
                                : hit.type === "THEME"
                                  ? "Add whole Theme"
                                  : `Add Theme "${hit.themeTitle}"`}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className={styles.tree}>
                {selectedSubject.themes.map((theme) => {
                  const themeOpen = expandedThemes.has(theme.id);
                  return (
                    <div key={theme.id} className={styles.themeBlock}>
                      <div className={styles.themeRow}>
                        <button
                          type="button"
                          className={styles.themeToggle}
                          onClick={() => setExpandedThemes((prev) => toggle(prev, theme.id))}
                        >
                          <span className={themeOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                          <span className={styles.themeTitle}>{theme.title}</span>
                          <span className="badge">
                            {theme.concepts.length} {theme.concepts.length === 1 ? "concept" : "concepts"}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => void handleAdd("THEME", theme.id)}
                          disabled={busy || addedThemeIds.has(theme.id)}
                        >
                          {addedThemeIds.has(theme.id) ? "Added ✓" : "Add whole Theme"}
                        </button>
                      </div>

                      {themeOpen && (
                        <div className={styles.concepts}>
                          {theme.concepts.map((concept) => {
                            const conceptOpen = expandedConcepts.has(concept.id);
                            return (
                              <div key={concept.id} className={styles.conceptBlock}>
                                <div className={styles.conceptRow}>
                                  <button
                                    type="button"
                                    className={styles.conceptToggle}
                                    onClick={() => setExpandedConcepts((prev) => toggle(prev, concept.id))}
                                  >
                                    <span className={conceptOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                                    <span className={styles.conceptTitle}>{concept.title}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => void handleAdd("CONCEPT", undefined, concept.id)}
                                    disabled={busy || addedConceptIds.has(concept.id)}
                                  >
                                    {addedConceptIds.has(concept.id) ? "Added ✓" : "Add"}
                                  </button>
                                </div>

                                {conceptOpen && (
                                  <ul className={styles.subConceptList}>
                                    {concept.subConcepts.map((subConcept) => (
                                      <li key={subConcept.id} className={styles.subConceptRow}>
                                        <span className={styles.dot} />
                                        {subConcept.title}
                                      </li>
                                    ))}
                                  </ul>
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
        )}
      </section>
      </div>

      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}
