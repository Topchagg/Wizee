"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type MyPath = { id: string; title: string; description: string | null; isPublic: boolean; itemCount: number };

export default function MyPathsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [paths, setPaths] = useState<MyPath[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    apiFetch("/paths/mine")
      .then((res) => (res.ok ? (res.json() as Promise<MyPath[]>) : Promise.reject()))
      .then(setPaths)
      .catch(() => {
        // Setting paths here breaks the loading guard on failure — otherwise
        // the page gets stuck on "Loading…" forever with no error visible.
        setPaths([]);
        setError("Couldn't load your paths.");
      });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch("/paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDescription.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      const created: { id: string } = await res.json();
      router.push(`/my-paths/${created.id}`);
    } catch {
      setError("Couldn't create the path.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/paths/${id}`, { method: "DELETE" });
    load();
  };

  if (authLoading || !paths) {
    return <div className="skeleton">Loading…</div>;
  }

  return (
    <div className="page-shell">
      <h1 className={styles.title}>My paths</h1>

      <div className={`card ${styles.createRow}`}>
        <input
          className="input"
          placeholder="e.g. Path to Enroll into Uni X — Faculty Y"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          className="input"
          placeholder="What's this path for? (optional)"
          rows={2}
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <button
          type="button"
          className={`btn btn-primary ${styles.createButton}`}
          onClick={() => void handleCreate()}
          disabled={creating || !newTitle.trim()}
        >
          {creating ? "Creating…" : "New path"}
        </button>
      </div>

      {paths.length === 0 && !error ? (
        <p className="text-secondary">You haven&rsquo;t built a path yet.</p>
      ) : (
        <ul className={styles.list}>
          {paths.map((path) => (
            <li key={path.id} className={`card ${styles.card}`}>
              <div>
                <h2 className={styles.pathTitle}>{path.title}</h2>
                {path.description && <p className={styles.description}>{path.description}</p>}
                <p className={styles.meta}>
                  <span className={path.isPublic ? "badge badge-success" : "badge"}>
                    {path.isPublic ? "Published" : "Draft"}
                  </span>{" "}
                  {path.itemCount} {path.itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <div className={styles.actions}>
                <Link href={`/my-paths/${path.id}`} className="btn btn-secondary btn-sm">
                  Edit
                </Link>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => void handleDelete(path.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}
