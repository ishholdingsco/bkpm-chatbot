// Streaming chat proxy to DeepSeek (OpenAI-compatible). The API key stays
// server-side and is never exposed to the browser.

export const runtime = "nodejs";

import realization from "@/data/investment-realization.json";
import sectors from "@/data/sectors.json";
import economic from "@/data/economic-indicators.json";
import hazard from "@/data/hazard.json";
import { MAP_TOOLS } from "@/components/map/mapActions";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

// Control frame used to ship structured map actions inside the otherwise
// plain-text stream. NUL never appears in prose, so the client can slice these
// `\0…\0` frames out cleanly (see useChat.js). Issue #7.
const FRAME = "\u0000";

// Authoritative source registry, derived from the team's data-requirements
// catalogue (data/data-requirements.csv, items D01–D16). When the assistant
// cites something it should point at the *real* primary source by name.
const SOURCE_REGISTRY = `Authoritative sources — cite these by name when relevant:
- Regulations & permits: JDIH BPK (peraturan.bpk.go.id) and peraturan.go.id [D01].
- BKPM legal basis for regional investment (PIR): Kepmen 50/2023 [D02].
- Downstreaming roadmap / industrial tree: BKPM "Gerbang Investasi Hilirisasi" & Kemenko Perekonomian [D03].
- Investment realization (PMA/PMDN): BKPM Satu Data (data.bkpm.go.id), cross-check BPS [D04].
- Regional project catalogue (PIR): regionalinvestment.bkpm.go.id [D05].
- Regional economic indicators (PDRB, labor, trade): BPS WebAPI (webapi.bps.go.id) [D06].
- Special Economic Zones (KEK): Dewan Nasional KEK (kek.go.id) [D10].
- Mining concessions (WIUP/IUP): ESDM MOMI / MinerbaOne (momi.minerba.esdm.go.id) — access-gated [D09].
- Disaster/hazard layers: InaRISK, BNPB (inarisk.bnpb.go.id) [D11].
- Geospatial basemap & admin boundaries: BIG Ina-Geoportal (tanahair.indonesia.go.id) [D08].`;

// Compact factual brief built from the static JSON in data/ so answers are
// grounded in the same numbers the map renders.
function buildDataBrief() {
  const n = realization.national_2024;
  const provReal = realization.by_province_2024_top
    .map((p) => `${p.province} Rp${p.value}T`)
    .join(", ");
  const topGrowth = [...economic.provinces]
    .sort((a, b) => b.growth_2024_pct - a.growth_2024_pct)
    .slice(0, 3)
    .map((p) => `${p.province} ${p.growth_2024_pct}%`)
    .join(", ");
  const highHazard = hazard.provinces
    .filter((p) => p.class === "High")
    .map((p) => `${p.province} (${p.top_hazards[0]})`)
    .join(", ");
  const hiliriSectors = sectors.sectors
    .filter((s) => s.tag === "Hilirisasi")
    .map((s) => s.name)
    .join(", ");
  return `Grounding data (prototype, FY2024 unless noted — figures are indicative):
- National investment realization: Rp${n.total}T (+${n.yoyGrowthPct}% YoY), FDI Rp${n.pma_fdi}T / domestic Rp${n.pmdn_domestic}T, ${n.jobs.toLocaleString("en-US")} jobs [BKPM].
- Top provinces by realization: ${provReal} [BKPM].
- Fastest-growing provincial economies: ${topGrowth} — nickel downstreaming driven [BPS].
- High disaster-risk provinces (site-selection caveat): ${highHazard} [InaRISK/BNPB].
- Priority hilirisasi sectors (100% foreign cap, tax-holiday eligible): ${hiliriSectors} [Perpres 10/2021].
Use these figures when relevant; do not invent contradicting numbers.`;
}

const BASE_SYSTEM_PROMPT = `You are "Nusantara", the AI investment analyst inside Wilaya — an investment-intelligence platform built for Indonesia's Investment Ministry / BKPM.

You help foreign and domestic investors understand opportunities in Indonesia: industrial estates (Kawasan Industri), Special Economic Zones (KEK), sectors (critical minerals & nickel midstream, renewable/geothermal energy, data centers, EV battery, manufacturing, aquaculture, tourism), regulations (Positive/Negative Investment List, Perpres 10/2021, tax holidays, DNI rules), ownership caps, incentives, and deal structuring.

Style:
- Be concise, precise and confident, like a sell-side analyst briefing a director.
- Use concrete figures, sectors and regions where helpful.
- When you reference a regulation or data source, name it inline (e.g. "Perpres 10/2021", "BKPM realisasi 2024"). Prefer the authoritative sources listed below. Do not fabricate specific clause numbers you are unsure of — keep them plausible and clearly framed.
- Prefer short paragraphs and tight bullet lists.
- This is a prototype/demo; if asked something outside Indonesian investment, answer briefly and steer back.

${buildDataBrief()}

${SOURCE_REGISTRY}`;

// Extra instruction added only when the caller (the map view) enables map
// tools. Tells the model it can actually drive the map via function calls.
const MAP_TOOLS_INSTRUCTION = `You are looking at the same interactive map as the user and can CONTROL it by calling functions:
- set_layers — show/hide data layers (industrial, kek, minerals, ports).
- fly_to — pan/zoom to a region or coordinate.
- filter_opportunities — filter & highlight the featured opportunity pins (by sector, province, commodity, or minimum foreign-ownership %).
When the user asks to see, show, zoom to, highlight, filter or focus on something on the map, CALL the matching function instead of only describing it. You may call several in one turn (e.g. fly_to + filter_opportunities). Always also reply with one or two short sentences explaining what you changed. Only the four layers above carry data — wiup/gdp/infra cannot be toggled yet.`;

// Build the JSON payload for a DeepSeek chat completion. Tools are attached
// only when provided, so the workspace chat (no map) behaves exactly as before.
function deepseekPayload(model, messages, tools) {
  const payload = { model, messages, stream: true, temperature: 0.6 };
  if (tools) {
    payload.tools = tools;
    payload.tool_choice = "auto";
  }
  return payload;
}

// Parse DeepSeek's SSE stream, forwarding content deltas to `onContent` and any
// tool-call deltas to `onToolCall`. Shared by the initial and follow-up calls.
async function pipeUpstream(upstream, { onContent, onToolCall }) {
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta;
        if (delta?.content && onContent) onContent(delta.content);
        if (delta?.tool_calls && onToolCall) onToolCall(delta.tool_calls);
      } catch {
        // ignore partial / non-JSON keepalive lines
      }
    }
  }
}

export async function POST(req) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  if (!apiKey) {
    return new Response("DEEPSEEK_API_KEY is not configured on the server.", { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const { messages = [], context, lang, mapTools = false } = body;

  // Reply in the user's active UI language (default Bahasa Indonesia). See #8.
  const LANGUAGE_INSTRUCTION = {
    id: "Reply in Bahasa Indonesia. Keep regulation names, figures and proper nouns as-is.",
    en: "Reply in English.",
    zh: "Reply in Simplified Chinese (简体中文). Keep regulation names, figures and proper nouns as-is.",
  };
  const langNote = LANGUAGE_INSTRUCTION[lang] || LANGUAGE_INSTRUCTION.id;

  // The map view passes mapTools:true so the assistant can drive the map.
  const toolsEnabled = mapTools === true;

  const system = [
    BASE_SYSTEM_PROMPT,
    langNote,
    toolsEnabled && MAP_TOOLS_INSTRUCTION,
    context && `Current context: ${context}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const chatMessages = [
    { role: "system", content: system },
    ...messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
      .map((m) => ({ role: m.role, content: String(m.content) })),
  ];

  const callUpstream = (msgs, tools) =>
    fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(deepseekPayload(model, msgs, tools)),
    });

  let upstream;
  try {
    upstream = await callUpstream(chatMessages, toolsEnabled ? MAP_TOOLS : null);
  } catch (err) {
    return new Response("Failed to reach DeepSeek API.", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return new Response(`DeepSeek API error (${upstream.status}). ${detail}`.trim(), {
      status: 502,
    });
  }

  // Re-emit the assistant's prose as a plain-text stream. When map tools are in
  // play we also accumulate any tool calls; once the first response finishes we
  // ship them as a `\0…\0` action frame, then — if the model only acted and
  // didn't speak — make a short follow-up call so it narrates what it changed.
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const toolCalls = [];
        let sawContent = false;

        await pipeUpstream(upstream, {
          onContent: (text) => {
            sawContent = true;
            controller.enqueue(encoder.encode(text));
          },
          onToolCall: (deltas) => {
            for (const tc of deltas) {
              const i = tc.index ?? 0;
              if (!toolCalls[i]) toolCalls[i] = { id: tc.id, name: "", args: "" };
              if (tc.id) toolCalls[i].id = tc.id;
              if (tc.function?.name) toolCalls[i].name = tc.function.name;
              if (tc.function?.arguments) toolCalls[i].args += tc.function.arguments;
            }
          },
        });

        const actions = [];
        for (const tc of toolCalls) {
          if (!tc || !tc.name) continue;
          let args = {};
          try {
            args = tc.args ? JSON.parse(tc.args) : {};
          } catch {
            args = {};
          }
          actions.push({ name: tc.name, args });
        }

        if (actions.length) {
          controller.enqueue(encoder.encode(FRAME + JSON.stringify({ actions }) + FRAME));

          // The model usually returns tool calls with no prose. Ask it to
          // narrate, feeding the tool calls + (stub) results back in context.
          if (!sawContent) {
            const followupMessages = [
              ...chatMessages,
              {
                role: "assistant",
                content: "",
                tool_calls: toolCalls
                  .filter((tc) => tc && tc.name)
                  .map((tc, i) => ({
                    id: tc.id || `call_${i}`,
                    type: "function",
                    function: { name: tc.name, arguments: tc.args || "{}" },
                  })),
              },
              ...toolCalls
                .filter((tc) => tc && tc.name)
                .map((tc, i) => ({
                  role: "tool",
                  tool_call_id: tc.id || `call_${i}`,
                  content: "Applied to the map.",
                })),
            ];
            const followup = await callUpstream(followupMessages, null);
            if (followup.ok && followup.body) {
              await pipeUpstream(followup, {
                onContent: (text) => controller.enqueue(encoder.encode(text)),
              });
            }
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode("\n\n⚠️ Stream interrupted."));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
