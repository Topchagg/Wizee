"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { uploadImage } from "@/lib/upload";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { user, loading: authLoading, appUser, appUserLoading, refreshAppUser } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);

  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, authLoading, router]);

  // Seed the form from appUser once it's loaded — not on every appUser
  // change, so a Save's own refreshAppUser() doesn't stomp on further edits
  // made while that request was in flight.
  useEffect(() => {
    if (initialized || appUserLoading || !appUser) return;
    void Promise.resolve().then(() => {
      setDisplayName(appUser.displayName ?? "");
      setBio(appUser.bio ?? "");
      setPhotoUrl(appUser.photoUrl ?? null);
      setInitialized(true);
    });
  }, [initialized, appUserLoading, appUser]);

  const handlePhotoFile = async (file: File) => {
    setError(null);
    setPhotoProgress(0);
    try {
      const url = await uploadImage(file, setPhotoProgress);
      setPhotoUrl(url);
    } catch {
      setError("Couldn't upload that picture.");
    } finally {
      setPhotoProgress(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const res = await apiFetch("/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          bio: bio.trim() || undefined,
          photoUrl: photoUrl ?? undefined,
        }),
      });
      if (!res.ok) {
        const body: { message?: string } = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(body.message) ? body.message.join(", ") : body.message ?? "Failed to save.");
      }
      await refreshAppUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || appUserLoading || !initialized) {
    return <div className="skeleton">Loading…</div>;
  }

  const initials = (displayName || appUser?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="page-shell">
      <div>
        <h1 className={styles.title}>Profile settings</h1>
        <p className={`text-secondary ${styles.subtitle}`}>
          Signed in as {appUser?.email}.
        </p>
      </div>

      <div className={`card ${styles.formCard}`}>
        <div className={styles.photoRow}>
          <div className={styles.photoPreview}>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary Firebase Storage URL, not worth an image-loader allowlist entry.
              <img src={photoUrl} alt="" className={styles.photoImg} />
            ) : (
              <span className={styles.photoInitials}>{initials}</span>
            )}
          </div>
          <div className={styles.photoField}>
            <span className="field-label">Picture</span>
            <input
              className={styles.fileInput}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && void handlePhotoFile(e.target.files[0])}
            />
            {photoProgress !== null && <p className={styles.progress}>Uploading… {photoProgress}%</p>}
          </div>
        </div>

        <label className="field-label">
          Name
          <input
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
          />
        </label>

        <label className="field-label">
          Bio
          <textarea
            className="input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A short line about you"
            rows={3}
            maxLength={280}
          />
        </label>

        <button type="button" className="btn btn-primary" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>

        {saved && !error && <p className={styles.savedText}>Saved ✓</p>}
        {error && <p className="text-danger">{error}</p>}
      </div>
    </div>
  );
}
