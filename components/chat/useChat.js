"use client";
// Shared chat hook — streams assistant replies from /api/chat (DeepSeek).
// Messages are generic objects; only { role, content } are sent to the API,
// so callers may attach extra render-only fields (name, time, cite…).

import { useCallback, useRef, useState } from "react";

export function useChat({ initialMessages = [], context, lang } = {}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  const send = useCallback(
    async (text) => {
      const content = (text ?? input).trim();
      if (!content || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setInput("");

      const userMsg = { role: "user", content };
      // Build the conversation we send to the API from current state.
      let convo = [];
      setMessages((prev) => {
        convo = [...prev, userMsg];
        return [...convo, { role: "assistant", content: "" }];
      });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: convo.map((m) => ({ role: m.role, content: m.content })),
            context,
            lang,
          }),
        });
        if (!res.ok || !res.body) throw new Error("Request failed: " + res.status);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
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
    [input, context, lang]
  );

  return { messages, setMessages, input, setInput, send, loading };
}
