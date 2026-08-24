import { io, type Socket } from "socket.io-client";

const CHAT_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/chat`;

// Called from an effect once we have a fresh Firebase ID token — never at
// module scope, same discipline as the Firebase SDK singletons in firebase.ts.
export function connectChatSocket(token: string): Socket {
  return io(CHAT_URL, { auth: { token }, transports: ["websocket"] });
}
