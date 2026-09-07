"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

// Blocks the app with a one-time "what's your main purpose" prompt right
// after sign-in, while `appUser.role` is still null. No Escape/backdrop
// dismissal — unlike the other modals in this app, this one isn't optional.
export function RoleGate() {
  const { user, appUser, appUserLoading, refreshAppUser } = useAuth();
  const [submitting, setSubmitting] = useState<"TUTOR" | "LEARNER" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user || appUserLoading || !appUser || appUser.role) {
    return null;
  }

  const choose = async (role: "TUTOR" | "LEARNER") => {
    setSubmitting(role);
    setError(null);
    try {
      const res = await apiFetch("/auth/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      await refreshAppUser();
    } catch {
      setError("Couldn't save that — try again.");
      setSubmitting(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="card modal-card">
        <h2 className="modal-title">What&rsquo;s your main purpose on Wizee?</h2>
        <p className="modal-body">This decides what you&rsquo;ll have access to — pick whichever fits why you&rsquo;re here.</p>
        <div className="modal-actions modal-actions-stack">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void choose("TUTOR")}
            disabled={submitting !== null}
          >
            {submitting === "TUTOR" ? "Saving…" : "Tutoring — I want to create paths and content"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void choose("LEARNER")}
            disabled={submitting !== null}
          >
            {submitting === "LEARNER" ? "Saving…" : "Learning — I just want to learn"}
          </button>
        </div>
        {error && <p className="text-danger">{error}</p>}
      </div>
    </div>
  );
}
