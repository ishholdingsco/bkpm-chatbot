// Shared vocabulary for the chat <-> workspace-canvas integration (issue #26
// PR-2, same WandeRound pattern as components/map/mapActions.js). PLAIN module —
// no "use client", no browser imports — so it is used both by the server route
// (the tool *definitions* sent to DeepSeek) and by the client (the *builder*
// that turns a tool call into a real artifact card on the shared canvas).

// Artifact kinds the canvas can render, mirroring KIND_COLOR in ui/data.js.
export const CANVAS_KINDS = ["DOC", "MODEL", "DIAGRAM", "MAP"];

function clean(s, max) {
  return String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

// Normalize an add_artifact tool call into the shape ArtifactCard expects
// ({ kind, title, meta, highlight }). Defensive: bad/missing fields get sane
// fallbacks so a malformed call never breaks the canvas.
export function buildArtifact(args = {}) {
  const kindRaw = String(args.kind || "").toUpperCase();
  const kind = CANVAS_KINDS.includes(kindRaw) ? kindRaw : "DOC";
  const title = clean(args.title, 80) || "Artifact";
  const meta = clean(args.meta, 80) || "Dibuat AI";
  const highlight = clean(args.highlight, 120) || undefined;
  return { kind, title, meta, ...(highlight ? { highlight } : {}) };
}

// OpenAI-compatible tool/function definition handed to DeepSeek (server side).
export const CANVAS_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_artifact",
      description:
        "Pin a new artifact card to the shared canvas of the current workspace project. Use this when the user asks you to draft, build, sketch, model, map or pin something they would want to keep — e.g. a regulation summary (DOC), a comparable-deals / valuation model (MODEL), an SPV or process diagram (DIAGRAM), or a site/cluster map (MAP). Call it in addition to your normal text reply.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: CANVAS_KINDS, description: "Artifact type: DOC (regulation/memo), MODEL (financial/comp model), DIAGRAM (structure/process), MAP (sites/cluster)." },
          title: { type: "string", description: "Short, specific card title, e.g. 'Comp set — 4 nickel midstream deals'." },
          meta: { type: "string", description: "One-line metadata, e.g. 'Auto-generated · 14:02' or 'Regulation · 14 pages'." },
          highlight: { type: "string", description: "Optional one-line key takeaway, e.g. '100% foreign permitted'." },
        },
        required: ["kind", "title"],
      },
    },
  },
];
