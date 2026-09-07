"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { StatsCard } from "./_components/StatsCard";
import { SuggestModal } from "./_components/SuggestModal";
import { ThemeTree } from "./_components/ThemeTree";
import type { SuggestTarget, TreeSubject } from "./_components/types";
import styles from "./page.module.css";

export default function SubjectTreePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [subject, setSubject] = useState<TreeSubject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());

  const [suggestTarget, setSuggestTarget] = useState<SuggestTarget | null>(null);
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiFetch("/sub-concepts/tree")
      .then((res) => (res.ok ? (res.json() as Promise<TreeSubject[]>) : Promise.reject()))
      .then((subjects) => {
        const found = subjects.find((s) => s.slug === slug);
        if (!found) throw new Error();
        setSubject(found);
        // Open the first Theme by default so the page doesn't look empty.
        if (found.themes[0]) setExpandedThemes(new Set([found.themes[0].id]));
      })
      .catch(() => setError("Couldn't load this subject."));
  }, [slug, user, authLoading, router]);

  const openSuggest = (target: SuggestTarget) => {
    setSuggestTarget(target);
    setSuggestTitle("");
    setSuggestError(null);
    setNotice(null);
  };

  const submitSuggestion = async () => {
    if (!suggestTarget || !suggestTitle.trim()) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const path =
        suggestTarget.kind === "theme"
          ? "/suggestions/themes"
          : suggestTarget.kind === "concept"
            ? "/suggestions/concepts"
            : "/suggestions/sub-concepts";
      const idField =
        suggestTarget.kind === "theme" ? "subjectId" : suggestTarget.kind === "concept" ? "themeId" : "conceptId";
      const res = await apiFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [idField]: suggestTarget.parentId, title: suggestTitle.trim() }),
      });
      if (!res.ok) throw new Error();
      setSuggestTarget(null);
      setNotice("Thanks — an admin will review your suggestion.");
    } catch {
      setSuggestError("Couldn't send that suggestion — try again.");
    } finally {
      setSuggesting(false);
    }
  };

  if (authLoading || (!subject && !error)) {
    return <div className="skeleton">Loading…</div>;
  }

  if (error || !subject) {
    return (
      <div className="page-shell">
        <Link href="/subjects" className={styles.back}>
          ← Subjects
        </Link>
        <p className="text-danger">{error ?? "Subject not found."}</p>
      </div>
    );
  }

  const concepts = subject.themes.flatMap((t) => t.concepts);
  const subConcepts = concepts.flatMap((c) => c.subConcepts);
  const filled = subConcepts.filter((sc) => sc.contentCount > 0).length;
  const percentFilled = subConcepts.length === 0 ? 0 : Math.round((filled / subConcepts.length) * 100);

  return (
    <div className="page-shell">
      <div>
        <Link href="/subjects" className={styles.back}>
          ← Subjects
        </Link>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{subject.title}</h1>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() =>
              openSuggest({ kind: "theme", parentId: subject.id, parentLabel: subject.title, placeholder: "e.g. Geometry" })
            }
          >
            + Suggest a Theme
          </button>
        </div>
      </div>

      {notice && <p className="text-secondary">{notice}</p>}

      <StatsCard
        themeCount={subject.themes.length}
        conceptCount={concepts.length}
        subConceptCount={subConcepts.length}
        percentFilled={percentFilled}
      />

      <ThemeTree
        themes={subject.themes}
        expandedThemes={expandedThemes}
        onExpandedThemesChange={setExpandedThemes}
        expandedConcepts={expandedConcepts}
        onExpandedConceptsChange={setExpandedConcepts}
        onSuggest={openSuggest}
      />

      {suggestTarget && (
        <SuggestModal
          target={suggestTarget}
          title={suggestTitle}
          onTitleChange={setSuggestTitle}
          suggesting={suggesting}
          error={suggestError}
          onSubmit={() => void submitSuggestion()}
          onClose={() => setSuggestTarget(null)}
        />
      )}
    </div>
  );
}
