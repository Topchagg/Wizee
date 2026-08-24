"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type PathProgress = {
  id: string;
  title: string;
  description: string | null;
  total: number;
  passedCount: number;
  nextSlug: string | null;
  nextContentId: string | null;
};

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [paths, setPaths] = useState<PathProgress[] | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    apiFetch("/paths/progress")
      .then((res) => (res.ok ? (res.json() as Promise<PathProgress[]>) : Promise.reject()))
      .then((data) => {
        if (!cancelled) setPaths(data);
      })
      .catch(() => {
        // Setting paths here breaks the loading guard on failure — otherwise
        // the page gets stuck on "Loading…" forever with no error visible.
        if (!cancelled) {
          setPaths([]);
          setError("Couldn't load your progress.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const handleContinue = (path: PathProgress) => {
    if (!path.nextContentId || !path.nextSlug) {
      setError("Couldn't start this path — it may be empty.");
      return;
    }
    setStartingId(path.id);
    router.push(`/learn/${path.nextSlug}/${path.nextContentId}`);
  };

  if (authLoading || !paths) {
    return <div className="skeleton">Loading…</div>;
  }

  const totalSubConcepts = paths.reduce((sum, p) => sum + p.total, 0);
  const totalPassed = paths.reduce((sum, p) => sum + p.passedCount, 0);

  return (
    <div className="page-shell">
      <div>
        <h1 className={styles.title}>Your progress</h1>
        <p className={`text-secondary ${styles.subtitle}`}>
          How far you&rsquo;ve gotten through each public Path, by Sub-concepts passed.
        </p>
      </div>

      {paths.length > 0 && (
        <div className={`card ${styles.summaryCard}`}>
          <span className={styles.summaryValue}>
            {totalPassed} / {totalSubConcepts}
          </span>
          <span className={styles.summaryLabel}>Sub-concepts passed across all public Paths</span>
        </div>
      )}

      {paths.length === 0 && !error ? (
        <p className="text-secondary">No public paths yet.</p>
      ) : (
        <ul className={styles.list}>
          {paths.map((path) => {
            const percent = path.total === 0 ? 0 : Math.round((path.passedCount / path.total) * 100);
            const complete = path.total > 0 && path.passedCount === path.total;
            return (
              <li key={path.id} className={`card ${styles.card}`}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.pathTitle}>{path.title}</h2>
                    {path.description && <p className={styles.description}>{path.description}</p>}
                  </div>
                  <span className={complete ? "badge badge-success" : "badge"}>
                    {path.passedCount}/{path.total} passed
                  </span>
                </div>

                <div className={styles.progressTrack}>
                  <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                </div>

                <div className={styles.cardFooter}>
                  <span className="text-secondary">{percent}% complete</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleContinue(path)}
                    disabled={startingId === path.id || path.total === 0}
                  >
                    {startingId === path.id ? "Starting…" : complete ? "Review" : "Continue"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}
