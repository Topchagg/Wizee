"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// Fallback for a slug-only /learn URL (e.g. a hand-typed or old-style link)
// — every in-app navigation already builds the full /learn/[slug]/[contentId]
// URL directly, so this only ever needs to redirect to the primary content.
export default function LearnSubConceptRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    apiFetch(`/sub-concepts/${slug}`)
      .then((res) => (res.ok ? (res.json() as Promise<{ content: { id: string } | null }>) : Promise.reject()))
      .then((data) => {
        if (!data.content) throw new Error();
        router.replace(`/learn/${slug}/${data.content.id}`);
      })
      .catch(() => setError("Couldn't load this concept."));
  }, [slug, user, authLoading, router]);

  if (error) {
    return (
      <div className="page-shell">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return <div className="skeleton">Loading…</div>;
}
