"use client";
// Shared chat hook — streams assistant replies from /api/chat (DeepSeek).
// Messages are generic objects; only { role, content } are sent to the API,
// so callers may attach extra render-only fields (name, time, cite…).
//
// A flaky connection shouldn't fail the chat outright: when a request can't be
// reached (network error, 5xx, empty body) the hook retries a few times with
// exponential backoff, staying in the loading state and surfacing a quiet
// "reconnecting" hint, before giving up with the server's error detail. Client
// errors (4xx) and mid-stream drops that already showed text are not retried.

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/ui";

// Retry policy for reach failures: up to 3 retries with growing backoff.
const BACKOFF_MS = [500, 1000, 2000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A reach/stream failure carrying whether it's worth retrying and any server
// detail to show once we give up.
class ChatError extends Error {
  constructor(message, { retryable = false, detail = "" } = {}) {
    super(message);
    this.retryable = retryable;
    this.detail = detail;
  }
}

// Some models echo the tool call as a literal `{"actions":[…]}` blob in their
// prose on top of the real function call. Strip any such object (brace-balanced,
// so nested args survive) before display. An unterminated trailing blob — a
// partial during streaming — is dropped too, so JSON never flashes on screen.
function stripActionJson(s) {
  let out = "";
  let i = 0;
  while (i < s.length) {
    const start = s.indexOf('{"actions"', i);
    if (start === -1) { out += s.slice(i); break; }
    out += s.slice(i, start);
    let depth = 0, j = start;
    for (; j < s.length; j++) {
      if (s[j] === "{") depth++;
      else if (s[j] === "}" && --depth === 0) { j++; break; }
    }
    i = j; // skip the (possibly still-open) blob
  }
  return out;
}

// Map actions ride inside the plain-text stream framed by NUL bytes (see
// app/api/chat/route.js). Prose never contains NUL, so we can slice frames out.
const FRAME = "\u0000";

export function useChat({ initialMessages = [], context, lang, mapTools = false, treeTools = false, onAction } = {}) {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // True while a failed request is being retried — lets the UI show a quieter
  // "reconnecting" hint instead of the normal "thinking" indicator.
  const [retrying, setRetrying] = useState(false);
  const loadingRef = useRef(false);
  const { t } = useI18n();
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

  // Replace the in-flight (last) assistant bubble with `content`.
  const setAssistant = useCallback((content) => {
    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { role: "assistant", content };
      return copy;
    });
  }, []);

  // One attempt: open the stream and pump prose into the last bubble, applying
  // any action frames. Returns the accumulated prose. Throws a ChatError on
  // failure, flagging whether the attempt is safe to retry.
  const streamOnce = useCallback(
    async (apiMessages) => {
      let res;
      try {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, context, lang, mapTools, treeTools }),
        });
      } catch {
        throw new ChatError("network error", { retryable: true });
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        // 5xx (incl. the proxy's 502 from DeepSeek) is transient; 4xx is not.
        throw new ChatError("HTTP " + res.status, { retryable: res.status >= 500, detail });
      }
      if (!res.body) throw new ChatError("empty body", { retryable: true });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = ""; // prose shown to the user
      let raw = ""; // unprocessed tail that may hold a partial action frame
      while (true) {
        let chunk;
        try {
          chunk = await reader.read();
        } catch {
          // Connection dropped mid-stream. Only safe to retry if nothing was
          // shown yet — otherwise a re-run would duplicate the answer.
          throw new ChatError("stream interrupted", { retryable: acc === "" });
        }
        if (chunk.done) break;
        raw += decoder.decode(chunk.value, { stream: true });

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
          setAssistant(stripActionJson(acc));
        }
      }
      return acc;
    },
    [context, lang, mapTools, treeTools, setAssistant]
  );

  const send = useCallback(
    async (text) => {
      const content = (text ?? input).trim();
      if (!content || loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setRetrying(false);
      setInput("");

      const userMsg = { role: "user", content };
      // Build the conversation from the ref (latest committed messages) so the
      // full history is sent even though setMessages below is async.
      const convo = [...messagesRef.current, userMsg];
      messagesRef.current = [...convo, { role: "assistant", content: "" }];
      setMessages(messagesRef.current);
      const apiMessages = convo.map((m) => ({ role: m.role, content: m.content }));

      let lastError = null;
      for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
        if (attempt > 0) {
          // Stay in loading, surface a quiet reconnect hint, then back off.
          setRetrying(true);
          await sleep(BACKOFF_MS[attempt - 1]);
        }
        try {
          const acc = await streamOnce(apiMessages);
          if (!acc) setAssistant("(no response)");
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          // Retry only transient reach failures, and only while attempts remain.
          if (!err.retryable || attempt === BACKOFF_MS.length) break;
        }
      }

      if (lastError) {
        const detail = (lastError.detail || "").trim();
        setAssistant(detail ? `${t("chat.failed")}\n\n${detail}` : t("chat.failed"));
      }

      setRetrying(false);
      loadingRef.current = false;
      setLoading(false);
    },
    [input, streamOnce, setAssistant, t]
  );

  return { messages, setMessages, input, setInput, send, loading, retrying };
}
