"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { getFirebaseAuth } from "@/lib/firebase";
import { connectChatSocket } from "@/lib/socket";
import styles from "./page.module.css";

type Message = { id: string; senderId: string; recipientId: string; content: string; createdAt: string };
type OtherUser = { id: string; displayName: string | null; email: string };
type Me = { id: string };

export default function ChatThreadPage() {
  const { userId: otherUserId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [myId, setMyId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    Promise.all([
      apiFetch("/auth/me").then((res) => (res.ok ? (res.json() as Promise<Me>) : Promise.reject())),
      apiFetch("/messages/users").then((res) => (res.ok ? (res.json() as Promise<OtherUser[]>) : Promise.reject())),
      apiFetch(`/messages/${otherUserId}`).then((res) => (res.ok ? (res.json() as Promise<Message[]>) : Promise.reject())),
    ])
      .then(([me, users, history]) => {
        if (cancelled) return;
        setMyId(me.id);
        setOtherUser(users.find((u) => u.id === otherUserId) ?? null);
        setMessages(history);
      })
      .catch(() => {
        if (cancelled) return;
        // Without this, myId/messages stayed null forever on failure — stuck
        // on the spinner below instead of ever showing `error`.
        setLoadFailed(true);
        setError("Couldn't load this chat.");
      });

    let socket: Socket | undefined;
    getFirebaseAuth()
      .currentUser?.getIdToken()
      .then((token) => {
        if (cancelled || !token) return;
        socket = connectChatSocket(token);
        socketRef.current = socket;
        socket.on("newMessage", (message: Message) => {
          // The socket only ever receives messages where I'm sender or
          // recipient (server emits to my room), so this alone identifies
          // whether it belongs to the thread currently open.
          if (message.senderId === otherUserId || message.recipientId === otherUserId) {
            setMessages((prev) => (prev ? [...prev, message] : [message]));
          }
        });
      });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [otherUserId, user, authLoading, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !socketRef.current) return;
    socketRef.current.emit("sendMessage", { recipientId: otherUserId, content });
    setDraft("");
  };

  if (authLoading) {
    return <div className="skeleton">Loading…</div>;
  }

  if (loadFailed) {
    return (
      <div className="page-shell">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  if (!messages || !myId) {
    return <div className="skeleton">Loading…</div>;
  }

  const name = otherUser?.displayName ?? otherUser?.email ?? "Chat";

  return (
    <div className={styles.page}>
      <div className={`card ${styles.panel}`}>
        <div className={styles.header}>
          <Link href="/chat" className={styles.back} aria-label="Back to chat list">
            ←
          </Link>
          <span className={styles.avatar}>{name.trim().charAt(0).toUpperCase()}</span>
          <h1 className={styles.name}>{name}</h1>
        </div>

        <div className={styles.thread}>
          {messages.length === 0 && <p className={styles.empty}>Say hello 👋</p>}
          {messages.map((message) => (
            <div key={message.id} className={message.senderId === myId ? styles.mine : styles.theirs}>
              {message.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className={styles.composer}>
          <input
            className="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message…"
          />
          <button type="button" className="btn btn-primary" onClick={handleSend} disabled={!draft.trim()}>
            Send
          </button>
        </div>

        {error && <p className={`text-danger ${styles.error}`}>{error}</p>}
      </div>
    </div>
  );
}
