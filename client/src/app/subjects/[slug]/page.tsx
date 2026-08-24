"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { toggleSetMember } from "@/lib/set-utils";
import styles from "./page.module.css";

type TreeSubConcept = { id: string; title: string; slug: string; contentCount: number; primaryContentId: string | null };
type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
type TreeSubject = { id: string; title: string; slug: string; themes: TreeTheme[] };

export default function SubjectTreePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [subject, setSubject] = useState<TreeSubject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedThemes, setExpandedThemes] = useState<Set<string>>(new Set());
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());

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
        <h1 className={styles.title}>{subject.title}</h1>
      </div>

      <div className={`card ${styles.statsCard}`}>
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{subject.themes.length}</span>
            <span className={styles.statLabel}>{subject.themes.length === 1 ? "Theme" : "Themes"}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{concepts.length}</span>
            <span className={styles.statLabel}>{concepts.length === 1 ? "Concept" : "Concepts"}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{subConcepts.length}</span>
            <span className={styles.statLabel}>Sub-concepts</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{percentFilled}%</span>
            <span className={styles.statLabel}>Filled</span>
          </div>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${percentFilled}%` }} />
        </div>
      </div>

      <div className={`card ${styles.tree}`}>
        {subject.themes.length === 0 && <p className="text-secondary">No Themes yet.</p>}
        {subject.themes.map((theme) => {
          const themeOpen = expandedThemes.has(theme.id);
          return (
            <div key={theme.id} className={styles.themeBlock}>
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

              {themeOpen && (
                <div className={styles.concepts}>
                  {theme.concepts.map((concept) => {
                    const conceptOpen = expandedConcepts.has(concept.id);
                    return (
                      <div key={concept.id} className={styles.conceptBlock}>
                        <button
                          type="button"
                          className={styles.conceptRow}
                          onClick={() => setExpandedConcepts((prev) => toggleSetMember(prev, concept.id))}
                        >
                          <span className={conceptOpen ? styles.chevronOpen : styles.chevron}>▸</span>
                          <span className={styles.conceptTitle}>{concept.title}</span>
                          <span className="badge">{concept.subConcepts.length} sub-concepts</span>
                        </button>

                        {conceptOpen && (
                          <ul className={styles.subConceptList}>
                            {concept.subConcepts.map((subConcept) =>
                              subConcept.contentCount > 0 && subConcept.primaryContentId ? (
                                <li key={subConcept.id}>
                                  <Link
                                    href={`/learn/${subConcept.slug}/${subConcept.primaryContentId}`}
                                    className={styles.subConceptRow}
                                  >
                                    <span className={styles.dot} />
                                    <span className={styles.subConceptTitle}>{subConcept.title}</span>
                                    <span className="badge badge-success">
                                      {subConcept.contentCount} {subConcept.contentCount === 1 ? "video" : "videos"}
                                    </span>
                                  </Link>
                                </li>
                              ) : (
                                <li key={subConcept.id} className={styles.subConceptRowEmpty}>
                                  <span className={styles.dotEmpty} />
                                  <span className={styles.subConceptTitle}>{subConcept.title}</span>
                                  <Link href="/add-content" className={styles.addContentLink}>
                                    + Add content
                                  </Link>
                                </li>
                              ),
                            )}
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
    </div>
  );
}
