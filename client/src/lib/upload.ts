import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFirebaseStorage } from "./firebase";

// Reads a video file's duration client-side (via a throwaway <video>
// element) without uploading it — used to reject an over-length preview
// before spending the upload.
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read video metadata"));
    };
    video.src = url;
  });
}

// Direct browser -> Firebase Storage upload (no bytes pass through the Nest
// server). Authorization is enforced by Storage security rules, which check
// the caller's Firebase Auth session — see storage.rules at the repo root.
export function uploadVideo(file: File, folder: "main" | "preview", onProgress?: (pct: number) => void): Promise<string> {
  const path = `videos/${folder}/${Date.now()}-${crypto.randomUUID()}-${file.name}`;
  const storageRef = ref(getFirebaseStorage(), path);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve).catch(reject),
    );
  });
}
