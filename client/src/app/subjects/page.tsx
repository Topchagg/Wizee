"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type TreeSubConcept = { id: string; title: string; contentCount: number };
type TreeConcept = { id: string; title: string; subConcepts: TreeSubConcept[] };
type TreeTheme = { id: string; title: string; concepts: TreeConcept[] };
type TreeSubject = { id: string; title: string; slug: string; themes: TreeTheme[] };

function countSubject(subject: TreeSubject) {
  const concepts = subject.themes.flatMap((t) => t.concepts);
  const subConcepts = concepts.flatMap((c) => c.subConcepts);
  const filled = subConcepts.filter((sc) => sc.contentCount > 0).length;
  return { themeCount: subject.themes.length, conceptCount: concepts.length, subConceptCount: subConcepts.length, filled };
}

export default function SubjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<TreeSubject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    apiFetch("/sub-concepts/tree")
      .then((res) => (res.ok ? (res.json() as Promise<TreeSubject[]>) : Promise.reject(res.status)))
      .then(setSubjects)
      .catch((status) => {
        // Setting subjects here (not leaving it null) is what breaks the loading
        // guard below — without it, a failed fetch left the page stuck on
        // "Loading…" forever with the error message unreachable.
        setSubjects([]);
        setError(status === 401 ? "Session expired — please sign in again." : "Couldn't load subjects.");
      });
  }, [user, authLoading, router]);

  if (authLoading || !subjects) {
    return <div className="skeleton">Loading…</div>;
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className={styles.title}>Subjects</h1>
        <p className={`text-secondary ${styles.subtitle}`}>
          Browse the full information graph — every Subject, Theme, Concept, and Sub-concept that
          exists, whether or not it has content yet.
        </p>
      </div>

      {subjects.length === 0 && !error ? (
        <p className="text-secondary">No subjects have been built yet.</p>
      ) : (
        <ul className={styles.list}>
          {subjects.map((subject) => {
            const counts = countSubject(subject);
            return (
              <li key={subject.id}>
                <Link href={`/subjects/${subject.slug}`} className={`card ${styles.card}`}>
                  <div>
                    <h2 className={styles.subjectTitle}>{subject.title}</h2>
                    <p className={styles.meta}>
                      {counts.themeCount} {counts.themeCount === 1 ? "theme" : "themes"} ·{" "}
                      {counts.conceptCount} {counts.conceptCount === 1 ? "concept" : "concepts"} ·{" "}
                      {counts.subConceptCount} sub-concepts
                    </p>
                  </div>
                  <span className={counts.filled === counts.subConceptCount ? "badge badge-success" : "badge"}>
                    {counts.filled}/{counts.subConceptCount} filled
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}
