"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type Me = { id: string; email: string; displayName: string | null };
type DailyConcept = { title: string; slug: string; contentId: string };
type DailyStatus = { passedToday: boolean; lastPassed: DailyConcept | null; next: DailyConcept | null };

const FEATURES = [
  {
    title: "One concept, one video",
    body: "30 seconds to 5 minutes. No unrelated filler, no hour-long lectures.",
  },
  {
    title: "Practice immediately",
    body: "A quiz, a fill-the-gap, a calculation — right after you watch, not at the end of a module.",
  },
  {
    title: "Another Explanation",
    body: "Didn't click? Instantly try a different teacher's take on the exact same concept.",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [daily, setDaily] = useState<DailyStatus | null>(null);
  const [startingDefault, setStartingDefault] = useState(false);

  const handleStartDefaultPath = async () => {
    setStartingDefault(true);
    try {
      const res = await apiFetch("/paths");
      const publicPaths: { id: string }[] = res.ok ? await res.json() : [];
      const defaultPath = publicPaths[0];
      if (!defaultPath) return;

      const resolvedRes = await apiFetch(`/paths/${defaultPath.id}/resolved`);
      if (!resolvedRes.ok) return;
      const resolved: { subConcepts: { slug: string; contentId: string | null }[] } = await resolvedRes.json();
      const first = resolved.subConcepts[0];
      if (first?.contentId) router.push(`/learn/${first.slug}/${first.contentId}`);
    } finally {
      setStartingDefault(false);
    }
  };

  useEffect(() => {
    // `me`/`daily` are only ever rendered in the authenticated branch below,
    // so there's nothing to reset when there's no user — just skip the fetch.
    if (!user) return;
    apiFetch("/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    apiFetch("/paths/daily")
      .then((res) => (res.ok ? (res.json() as Promise<DailyStatus>) : null))
      .then(setDaily)
      .catch(() => setDaily(null));
  }, [user]);

  if (loading) {
    return <div className="skeleton">Loading…</div>;
  }

  if (!user) {
    return (
      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <span className="badge badge-primary">Concept-based learning</span>
          <h1 className={styles.heroTitle}>Learn concepts. Not endless lectures.</h1>
          <p className={styles.heroSubtitle}>
            Wizee breaks every subject into small, independent concepts you can actually learn in a few
            minutes — with practice, alternate explanations, and spaced repetition built in.
          </p>
          <Link href="/login" className="btn btn-primary">
            Get started with Google
          </Link>
        </div>

        <div className={styles.features}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={`card ${styles.featureCard}`}>
              <h3>{feature.title}</h3>
              <p className="text-secondary">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div>
        <p className="text-secondary">
          {me ? "Signed in" : "Syncing…"} — {user.displayName ?? user.email}
        </p>
        <h1 className={styles.greeting}>What do you want to learn today?</h1>
      </div>

      {daily && (
        <div className={`card ${styles.dailyCard} ${daily.passedToday ? styles.dailyCardDone : ""}`}>
          <span className={styles.dailyIcon}>{daily.passedToday ? "✅" : "📅"}</span>
          <span className={styles.tileText}>
            {daily.passedToday ? (
              <>
                <h2>Today&rsquo;s plan is done</h2>
                <p className="text-secondary">
                  You passed {daily.lastPassed ? `"${daily.lastPassed.title}"` : "a Sub-concept"} today — you can
                  chill, or keep going if you&rsquo;re on a roll.
                </p>
              </>
            ) : (
              <>
                <h2>Today&rsquo;s Sub-concept</h2>
                <p className="text-secondary">
                  {daily.next ? (
                    <>
                      Next up: <strong>{daily.next.title}</strong>
                    </>
                  ) : (
                    "No Path in progress yet — pick one below to get started."
                  )}
                </p>
              </>
            )}
          </span>
          {daily.next && (
            <Link
              href={`/learn/${daily.next.slug}/${daily.next.contentId}`}
              className={daily.passedToday ? "btn btn-secondary" : "btn btn-primary"}
            >
              {daily.passedToday ? "Keep going →" : "Learn it →"}
            </Link>
          )}
        </div>
      )}

      <div className={styles.grid}>
        <button
          type="button"
          className={`card ${styles.linkCard} ${styles.linkCardButton} ${styles.tileStart}`}
          onClick={() => void handleStartDefaultPath()}
          disabled={startingDefault}
        >
          <span className={`${styles.tileIcon} ${styles.tileIconStart}`}>⚡</span>
          <span className={styles.tileText}>
            <h3>{startingDefault ? "Loading…" : "Start default Path"}</h3>
            <p className="text-secondary">Jump straight into the top-rated public Path, from wherever it begins.</p>
          </span>
        </button>
        <Link href="/choose-path" className={`card ${styles.linkCard} ${styles.tileChoose}`}>
          <span className={`${styles.tileIcon} ${styles.tileIconChoose}`}>🧭</span>
          <span className={styles.tileText}>
            <h3>Choose a Path</h3>
            <p className="text-secondary">Follow a path built by other learners toward a specific goal.</p>
          </span>
        </Link>
        <Link href="/my-paths" className={`card ${styles.linkCard} ${styles.tileBuild}`}>
          <span className={`${styles.tileIcon} ${styles.tileIconBuild}`}>🛠️</span>
          <span className={styles.tileText}>
            <h3>Build your own Path</h3>
            <p className="text-secondary">Assemble Themes and Concepts into a path of your own.</p>
          </span>
        </Link>
      </div>
    </div>
  );
}
