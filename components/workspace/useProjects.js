"use client";
// Workspace projects + threads store (issue #26). Zustand + persist, so projects,
// their threads, the per-thread conversations and canvas artifacts a user builds
// survive a refresh and the hop between /workspace/new and /workspace.
//
// Model: a *project* contains up to MAX_THREADS *threads*; each thread owns its
// own chat. The single default demo project (DATA.projects[0]) is NOT stored
// here — it stays as a backdrop in ActiveThread with its canned DATA.threads —
// but conversations the user has in those demo threads are persisted by thread
// id, like any other thread.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_THREADS = 4;

// Build a short mono code from a project name, e.g. "Geothermal — North
// Sumatra" → "GEOTHERMAL.NS". Mirrors the hand-written codes in DATA.projects.
function shortCode(name, sector) {
  const words = String(name || "").trim().split(/[\s—–-]+/).filter(Boolean);
  const head = (words[0] || "PROJECT").toUpperCase().slice(0, 10);
  const tailWords = words.slice(1);
  const tail = tailWords.length
    ? tailWords.map((w) => w[0]).join("").toUpperCase().slice(0, 3)
    : String(sector || "").trim().split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 3);
  return tail ? `${head}.${tail}` : head;
}

// A thread name derived from its first message (a starter prompt), trimmed.
function clip(s, n) {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

let seq = 0;
function uid(prefix) {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

export const useProjects = create(
  persist(
    (set, get) => ({
      projects: [], // user-created only; newest first
      activeProjectId: null,
      threadsByProject: {}, // { [projectId]: [{ id, name }] } — user projects
      activeThreadByProject: {}, // { [projectId]: threadId }
      threadNames: {}, // { [threadId]: customName } — rename override (any thread)
      messagesByThread: {}, // { [threadId]: Message[] } — persisted conversations
      artifactsByProject: {}, // { [projectId]: Artifact[] } — AI-generated canvas
      // A starter prompt waiting to be auto-sent as a thread's first user
      // message. Consumed once by ThreadColumn on mount.
      pending: null, // { threadId, message }

      // Create a project (and its first thread) from the new-project form or a
      // starter. Returns { projectId, threadId }. `firstMessage` titles & seeds
      // the first thread, and is auto-sent in the workspace.
      createProject: ({ name, sector, firstMessage } = {}) => {
        const finalName = String(name || "").trim() || sector || "Proyek baru";
        const projectId = uid("p");
        const threadId = uid("t");
        const threadName = firstMessage ? clip(firstMessage, 48) : "Utas baru";
        set((s) => ({
          projects: [
            { id: projectId, name: finalName, short: shortCode(finalName, sector), sector: sector || null, stage: "Scoping" },
            ...s.projects,
          ],
          activeProjectId: projectId,
          threadsByProject: { ...s.threadsByProject, [projectId]: [{ id: threadId, name: threadName }] },
          activeThreadByProject: { ...s.activeThreadByProject, [projectId]: threadId },
          pending: firstMessage ? { threadId, message: firstMessage } : null,
        }));
        return { projectId, threadId };
      },

      // Add a new (empty) thread to a project and make it active. `existingCount`
      // is the project's current thread count incl. any canned demo threads, so
      // the MAX_THREADS cap is enforced uniformly. Returns the new id, or null
      // when the project is already at the cap.
      createThread: (projectId, existingCount = 0) => {
        if (existingCount >= MAX_THREADS) return null;
        const threadId = uid("t");
        set((s) => ({
          threadsByProject: {
            ...s.threadsByProject,
            [projectId]: [...(s.threadsByProject[projectId] || []), { id: threadId, name: "Utas baru" }],
          },
          activeThreadByProject: { ...s.activeThreadByProject, [projectId]: threadId },
        }));
        return threadId;
      },

      setActiveProject: (id) => set({ activeProjectId: id }),
      setActiveThread: (projectId, threadId) =>
        set((s) => ({ activeThreadByProject: { ...s.activeThreadByProject, [projectId]: threadId } })),

      // Rename any thread (demo or user) via a display-name override.
      renameThread: (threadId, name) =>
        set((s) => ({ threadNames: { ...s.threadNames, [threadId]: name } })),

      // Persist a thread's conversation so switching threads / refreshing keeps it.
      setThreadMessages: (threadId, messages) =>
        set((s) => ({ messagesByThread: { ...s.messagesByThread, [threadId]: messages } })),

      // Append an AI-generated artifact to a project's canvas (newest first).
      addArtifact: (projectId, artifact) =>
        set((s) => ({
          artifactsByProject: {
            ...s.artifactsByProject,
            [projectId]: [artifact, ...(s.artifactsByProject[projectId] || [])],
          },
        })),

      // Hand back (and clear) a pending starter message for `threadId`, so it is
      // sent exactly once.
      consumePending: (threadId) => {
        const { pending } = get();
        if (!pending || pending.threadId !== threadId) return null;
        set({ pending: null });
        return pending.message;
      },
    }),
    { name: "wilaya.workspace" }
  )
);
