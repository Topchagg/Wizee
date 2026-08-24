"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

type Conversation = {
  userId: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
};
type OtherUser = { id: string; displayName: string | null; email: string };

const initialsOf = (name: string) => name.trim().charAt(0).toUpperCase();

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [otherUsers, setOtherUsers] = useState<OtherUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    Promise.all([
      apiFetch("/messages/conversations").then((res) => (res.ok ? res.json() : Promise.reject())),
      apiFetch("/messages/users").then((res) => (res.ok ? res.json() : Promise.reject())),
    ])
      .then(([conv, users]: [Conversation[], OtherUser[]]) => {
        setConversations(conv);
        setOtherUsers(users);
      })
      .catch(() => {
        // Without these, a failed fetch previously resolved to `[]` silently
        // (masking real errors as "no chats") or left state null forever
        // (stuck spinner) — neither ever showed the error message below.
        setConversations([]);
        setOtherUsers([]);
        setError("Couldn't load chats.");
      });
  }, [user, authLoading, router]);

  if (authLoading || !conversations || !otherUsers) {
    return <div className="skeleton">Loading…</div>;
  }

  const conversationIds = new Set(conversations.map((c) => c.userId));
  const newContacts = otherUsers.filter((u) => !conversationIds.has(u.id));

  return (
    <div className="page-shell">
      <h1 className={styles.title}>Chat</h1>

      {conversations.length > 0 && (
        <ul className={styles.list}>
          {conversations.map((conv) => (
            <li key={conv.userId}>
              <Link href={`/chat/${conv.userId}`} className={`card ${styles.row}`}>
                <span className={styles.avatar}>{initialsOf(conv.name)}</span>
                <span className={styles.rowBody}>
                  <span className={styles.name}>{conv.name}</span>
                  <span className={styles.preview}>
                    {conv.lastMessageFromMe ? "You: " : ""}
                    {conv.lastMessage}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {newContacts.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Start a new chat</h2>
          <ul className={styles.list}>
            {newContacts.map((u) => (
              <li key={u.id}>
                <Link href={`/chat/${u.id}`} className={`card ${styles.row}`}>
                  <span className={styles.avatar}>{initialsOf(u.displayName ?? u.email)}</span>
                  <span className={styles.rowBody}>
                    <span className={styles.name}>{u.displayName ?? u.email}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {conversations.length === 0 && newContacts.length === 0 && !error && (
        <p className="text-secondary">No one else has signed up yet.</p>
      )}

      {error && <p className="text-danger">{error}</p>}
    </div>
  );
}
