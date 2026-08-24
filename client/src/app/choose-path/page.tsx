"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type PublicPath = { id: string; title: string; description: string | null; createdBy: string; itemCount: number };

export default function ChoosePathPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [paths, setPaths] = useState<PublicPath[] | null>(null);
  const [query, setQuery] = useState("");
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    apiFetch("/paths")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json() as Promise<PublicPath[]>;
      })
      .then((data) => {
        if (!cancelled) setPaths(data);
      })
      .catch(() => {
        // Setting paths here breaks the loading guard on failure — otherwise
        // the page gets stuck on "Loading…" forever with no error visible.
        if (!cancelled) {
          setPaths([]);
          setError("Couldn't load paths.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  const handleStart = async (pathId: string) => {
    setStartingId(pathId);
    setError(null);
    try {
      const res = await apiFetch(`/paths/${pathId}/resolved`);
      if (!res.ok) throw new Error();
      const resolved: { subConcepts: { slug: string; contentId: string | null }[] } = await res.json();
      const [first] = resolved.subConcepts;
      if (!first?.contentId) throw new Error();
      router.push(`/learn/${first.slug}/${first.contentId}`);
    } catch {
      setError("Couldn't start this path — it may be empty.");
      setStartingId(null);
    }
  };

  const filteredPaths = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !paths) return paths ?? [];
    return paths.filter(
      (path) =>
        path.title.toLowerCase().includes(q) ||
        path.description?.toLowerCase().includes(q) ||
        path.createdBy.toLowerCase().includes(q),
    );
  }, [paths, query]);

  if (authLoading || !paths) {
    return <div className="skeleton">Loading…</div>;
  }

  return (
    <div className="page-shell">
      <div>
        <h1 className={styles.title}>Choose a path</h1>
        <p className={`text-secondary ${styles.subtitle}`}>
          Paths built by other learners toward a specific goal — e.g. &ldquo;Path to Enroll into Uni
          X — Faculty Y&rdquo;. Following one just plays its Sub-concepts in order.
        </p>
      </div>

      {paths.length > 0 && (
        <input
          className="input"
          placeholder="Search paths by title, description, or creator…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {paths.length === 0 && !error ? (
        <p className="text-secondary">No public paths yet.</p>
      ) : filteredPaths.length === 0 ? (
        <p className="text-secondary">No paths match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className={styles.list}>
          {filteredPaths.map((path) => (
            <li key={path.id} className={`card ${styles.card}`}>
              <div>
                <h2 className={styles.pathTitle}>{path.title}</h2>
                {path.description && <p className={styles.description}>{path.description}</p>}
                <p className={styles.meta}>
                  by {path.createdBy} · {path.itemCount} {path.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void handleStart(path.id)}
                disabled={startingId === path.id}
              >
                {startingId === path.id ? "Starting…" : "Start"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}
