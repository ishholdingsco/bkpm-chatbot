"use client";
// Shared chat hook — streams assistant replies from /api/chat (DeepSeek).
// Messages are generic objects; only { role, content } are sent to the API,
// so callers may attach extra render-only fields (name, time, cite…).

import { useCallback, useEffect, useRef, useState } from "react";

// Map actions ride inside the plain-text stream framed by NUL bytes (see
// app/api/chat/route.js). Prose never contains NUL, so we can slice frames out.
const FRAME = "\u0000";

export function useChat({ initialMessages = [], context, lang, mapTools = false, onAction } = {}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  // Mirror of `messages` read synchronously when building the request. React 19
  // defers setState updaters, so capturing history inside a setMessages updater
  // races the fetch and can send an empty conversation — read the ref instead.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  // Keep the latest onAction without resubscribing `send` on every render.
  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  const send = useCallback(
    async (text) => {
      const content = (text ?? input).trim();
      if (!content || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setInput("");

      const userMsg = { role: "user", content };
      // Build the conversation from the ref (latest committed messages) so the
      // full history is sent even though setMessages below is async.
      const convo = [...messagesRef.current, userMsg];
      messagesRef.current = [...convo, { role: "assistant", content: "" }];
      setMessages(messagesRef.current);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: convo.map((m) => ({ role: m.role, content: m.content })),
            context,
            lang,
            mapTools,
          }),
        });
        if (!res.ok || !res.body) throw new Error("Request failed: " + res.status);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = ""; // prose shown to the user
        let raw = ""; // unprocessed tail that may hold a partial action frame
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });

          // Pull out every complete `\0…\0` action frame; the rest is prose.
          let prose = "";
          while (true) {
            const start = raw.indexOf(FRAME);
            if (start === -1) {
              prose += raw;
              raw = "";
              break;
            }
            prose += raw.slice(0, start);
            const end = raw.indexOf(FRAME, start + 1);
            if (end === -1) {
              raw = raw.slice(start); // incomplete frame — wait for more bytes
              break;
            }
            const frame = raw.slice(start + 1, end);
            raw = raw.slice(end + 1);
            try {
              const { actions } = JSON.parse(frame);
              if (Array.isArray(actions) && actions.length) onActionRef.current?.(actions);
            } catch {
              // ignore a malformed frame rather than break the chat
            }
          }

          if (prose) {
            acc += prose;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              return copy;
            });
          }
        }
        if (!acc) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: "(no response)" };
            return copy;
          });
        }
      } catch (err) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "⚠️ Couldn't reach the assistant. Check the DeepSeek API key and try again.",
          };
          return copy;
        });
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [input, context, lang, mapTools]
  );

  return { messages, setMessages, input, setInput, send, loading };
}
