// Shared vocabulary for the chat <-> hilirisasi-tree integration (issue #24,
// same WandeRound pattern as the map's mapActions.js). PLAIN module — no
// "use client", no browser imports — so it works both on the server route (the
// tool *definitions* sent to DeepSeek) and on the client (the *executors* that
// drive the real value-chain canvas).

// Canonical commodity keys, matching COMMODITY_TREES in HilirisasiPage.js.
export const HIL_COMMODITIES = ["Nikel", "Sawit", "Kelapa", "Rumput Laut"];

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

// English / loose aliases → canonical key, so the assistant can say "Palm Oil"
// or "seaweed" and still hit the right tree.
const COMMODITY_ALIASES = {
  nikel: "Nikel", nickel: "Nikel",
  sawit: "Sawit", "kelapa sawit": "Sawit", "palm oil": "Sawit", palm: "Sawit", cpo: "Sawit",
  kelapa: "Kelapa", coconut: "Kelapa",
  "rumput laut": "Rumput Laut", seaweed: "Rumput Laut", "sea weed": "Rumput Laut", algae: "Rumput Laut",
};

// Resolve a commodity name (any language/alias) → canonical key, or null.
export function resolveCommodity(name) {
  const q = norm(name);
  if (!q) return null;
  if (COMMODITY_ALIASES[q]) return COMMODITY_ALIASES[q];
  // loose contains-match against aliases and canonical names
  const hit = Object.keys(COMMODITY_ALIASES).find((k) => q.includes(k) || k.includes(q));
  if (hit) return COMMODITY_ALIASES[hit];
  const canon = HIL_COMMODITIES.find((c) => norm(c) === q || q.includes(norm(c)));
  return canon || null;
}

// OpenAI-compatible tool/function definitions handed to DeepSeek (server side)
// when the hilirisasi view enables tree tools.
export const TREE_TOOLS = [
  {
    type: "function",
    function: {
      name: "set_commodity",
      description:
        "Switch the value-chain (hilirisasi) tree shown to a different commodity. Call this when the user asks about another commodity. Commodities: Nikel (Nickel), Sawit (Palm Oil), Kelapa (Coconut), Rumput Laut (Seaweed).",
      parameters: {
        type: "object",
        properties: {
          commodity: { type: "string", enum: HIL_COMMODITIES, description: "Target commodity to display." },
        },
        required: ["commodity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "focus_node",
      description:
        "Pan and zoom the value-chain canvas to a specific product node and highlight it (shows its trade tooltip). Use the node id or exact product name listed for the current tree in the context. Optionally pass commodity to switch the tree first.",
      parameters: {
        type: "object",
        properties: {
          node: { type: "string", description: "Node id or product name to focus, e.g. 'mhp', 'batteries', 'Cooking Oil'." },
          commodity: { type: "string", enum: HIL_COMMODITIES, description: "Optional: switch to this commodity before focusing." },
        },
        required: ["node"],
      },
    },
  },
];
