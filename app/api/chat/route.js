// Streaming chat proxy to DeepSeek (OpenAI-compatible). The API key stays
// server-side and is never exposed to the browser.

export const runtime = "nodejs";

import realization from "@/data/investment-realization.json";
import sectors from "@/data/sectors.json";
import economic from "@/data/economic-indicators.json";
import hazard from "@/data/hazard.json";
import logamData from "@/data/mineral-logam.json";
import iupData from "@/data/iup-tambang.json";
import kawasanHutanData from "@/data/kawasan-hutan.json";
import geologiData from "@/data/geologi-litologi.json";
import { MAP_TOOLS } from "@/components/map/mapActions";
import { TREE_TOOLS } from "@/components/hilirisasi/treeActions";
import { CANVAS_TOOLS } from "@/components/workspace/canvasActions";

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

// Aggregate brief over the two mining datasets the map renders (mineral-logam
// occurrence points + IUP concession polygons). Computed once at module load so
// the assistant can answer "how many coal IUPs?", "which province holds the most
// nickel concessions?", etc. — grounded in the same data the layers draw.
function buildMiningBrief() {
  const countBy = (feats, key) => feats.reduce((m, f) => {
    const v = f.properties?.[key] || "—"; m[v] = (m[v] || 0) + 1; return m;
  }, {});
  const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

  const logamStr = top(countBy(logamData.features, "commodity"), 6).map(([k, v]) => `${k} ${v}`).join(", ");
  // Ore tonnage on the logam points. We surface ONLY the ore ("Bijih") figure,
  // because that is exactly what the map tooltip shows ("Bijih X jt ton"). Each
  // point also has metal_t in the raw data, but the tooltip never displays it,
  // so we keep the assistant aligned with what the user actually sees and do
  // not feature contained-metal as a headline number. Format mirrors the
  // tooltip's Indonesian "jt ton / miliar ton" vocabulary (see formatTon).
  const fmtT = (n) => {
    const v = Number(n) || 0;
    if (v >= 1e9) return `${(v / 1e9).toFixed(2).replace(".", ",")} miliar ton`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2).replace(".", ",")} jt ton`;
    if (v >= 1e3) return `${Math.round(v / 1e3).toLocaleString("id-ID")} rb ton`;
    return `${Math.round(v).toLocaleString("id-ID")} ton`;
  };
  const logamOre = logamData.features.reduce((m, f) => {
    const c = f.properties?.commodity || "—";
    const ore = Number(f.properties?.ore_t) || 0;
    m.byComm[c] = (m.byComm[c] || 0) + ore; m.total += ore;
    return m;
  }, { total: 0, byComm: {} });
  const logamTonStr = Object.entries(logamOre.byComm)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ≈${fmtT(v)}`)
    .join("; ");
  const iupComm = top(countBy(iupData.features, "commodity"), 6).map(([k, v]) => `${k} ${v}`).join(", ");
  const iupProv = top(countBy(iupData.features, "prov"), 6).map(([k, v]) => `${k} (${v})`).join(", ");
  // Per-province detail for the top provinces so "IUP apa aja di Kaltim?" can be
  // answered concretely: count, commodity split, and a couple of example
  // companies (largest by area) — all straight from the data, no invention.
  const iupProvDetail = top(countBy(iupData.features, "prov"), 6).map(([prov]) => {
    const feats = iupData.features.filter((f) => f.properties?.prov === prov);
    const comm = top(countBy(feats, "commodity"), 4).map(([k, v]) => `${k} ${v}`).join("/");
    const ex = [...feats]
      .sort((a, b) => (Number(b.properties?.area_ha) || 0) - (Number(a.properties?.area_ha) || 0))
      .slice(0, 3)
      .map((f) => f.properties?.company)
      .filter(Boolean)
      .join(", ");
    return `  · ${prov}: ${feats.length} IUP (${comm})${ex ? `, e.g. ${ex}` : ""}`;
  }).join("\n");
  const totalHa = iupData.features.reduce((s, f) => s + (Number(f.properties?.area_ha) || 0), 0);
  let prod = 0, sanksi = 0, expl = 0;
  for (const f of iupData.features) {
    const s = (f.properties?.stage || "").toUpperCase();
    if (s.includes("PRODUKSI")) prod++;
    else if (s.includes("SANKSI")) sanksi++;
    else if (s.includes("EKSPLORASI")) expl++;
  }
  return `Mining datasets on the map (toggleable layers + filterable via filter_mining):
- Metal-mineral occurrence points (layer "logam", ${logamData.features.length} points, ESDM 50K geological survey): ${logamStr}. Nickel & iron ONLY (no coal/gold/copper). EACH point DOES carry an ore-tonnage estimate, labelled "Bijih" on its map tooltip (e.g. "Bijih 1,96 jt ton") — so tonnage data EXISTS, do NOT say it is unavailable. ALWAYS use the word "Bijih" (ore) for this figure to match the tooltip; NEVER print raw field names like "ore_t"/"metal_t". Aggregate ore (Bijih) by commodity: ${logamTonStr}. Total ≈${fmtT(logamOre.total)} of ore across all ${logamData.features.length} points. The dataset also holds a contained-metal figure per point, but the tooltip does NOT show it — so do NOT present contained-metal as a headline number; lead with the Bijih/ore figure the user can see, and only mention metal content briefly if explicitly asked. Caveat: these are indicative geological-survey estimates (not JORC/SNI-classified reserves), and the points carry NO province field — so you cannot sum tonnage for one province from this brief; for a specific area (e.g. Morowali), say the per-point "Bijih" tonnage is on each point's tooltip on the map.
- Mining business permits — IUP/IUPK/PKP2B concession polygons (layer "iup", ${iupData.features.length} concessions, ESDM Minerba One Map): by commodity ${iupComm}; top provinces ${iupProv}; total licensed area ≈${Math.round(totalHa).toLocaleString("en-US")} Ha; status ≈${prod} in production, ${sanksi} under sanction, ${expl} in exploration. Each concession carries company name, kabupaten, area (Ha), stage and SK validity.
  Per-province IUP detail (count, commodity split, example companies by largest area):
${iupProvDetail}
When asked about mining permits, concessions, IUP, or coal/nickel/iron mining areas/companies/provinces, use these figures AND call filter_mining (+ set_layers / fly_to) to show them on the map. Describe at the aggregate level unless the user zooms to a specific concession.`;
}

// Brief for the kawasan-hutan (forest-function) layer. Raster-derived thematic
// data: only a forest-function class per polygon, NO province / area / company
// attributes — so the brief stops the model inventing province breakdowns or
// precise areas, and points it at filter_kawasan_hutan to show/filter it.
function buildHutanBrief() {
  const fns = kawasanHutanData.features.map((f) => `${f.properties.fungsi} (${f.properties.code})`).join(", ");
  return `Forest areas on the map (toggleable layer "hutan", filterable via filter_kawasan_hutan):
- Kawasan hutan (forest-function zones) — nationwide, vectorized from a KLHK forest-status raster into ${kawasanHutanData.features.length} forest-function classes: ${fns}.
- This layer is THEMATIC and raster-derived: each polygon carries ONLY its forest function. It has NO province, area (Ha), company or permit attributes. Do NOT state or invent per-province area figures, total hectares, or which concession sits in which forest function — that data is not loaded. Treat the boundaries as indicative (simplified from a raster), not cadastral. To show or isolate a forest function, call filter_kawasan_hutan; to focus a place, pass its region — the view is then restricted to an APPROXIMATE rectangular extent (not exact province boundaries, since none are loaded).`;
}

// Brief for the geology-lithology layer. Like the forest layer it is thematic &
// raster-derived (rock-type group per polygon only — NO province / area), so the
// brief blocks invented per-province figures and points at filter_geologi.
function buildGeologiBrief() {
  const grps = geologiData.features.map((f) => f.properties.litologi).join(", ");
  return `Geology / lithology on the map (toggleable layer "geologi", filterable via filter_geologi):
- Geologi litologi — nationwide, vectorized from the ESDM Badan Geologi geology raster into ${geologiData.features.length} major rock-type groups: ${grps}.
- This layer is THEMATIC and raster-derived: each polygon carries ONLY its lithology group. It has NO province, area (km²/Ha), formation-name or age attributes. The group is a best-effort grouping of ~1400 formations (many sit in "Formasi / Batuan Tak Terinci"). Do NOT invent per-province area figures, hectares, specific formation names, or geological ages for it. Treat boundaries as indicative (simplified from a raster), not survey-grade. To show or isolate a rock type, call filter_geologi; to focus a place, pass its region — the view is then restricted to an APPROXIMATE rectangular extent (not exact province boundaries).`;
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

${buildMiningBrief()}

${buildHutanBrief()}

${buildGeologiBrief()}

${SOURCE_REGISTRY}`;

// Extra instruction added only when the caller (the map view) enables map
// tools. Tells the model it can actually drive the map via function calls.
const MAP_TOOLS_INSTRUCTION = `You are looking at the same interactive map as the user and can CONTROL it by calling functions:
- set_layers — show/hide data layers (industrial, kek, featured [BKPM opportunity pins], minerals, logam [metal-mineral Ni·Fe occurrence points], iup [mining permit / IUP concession polygons — coal·nickel·iron], hutan [forest-function areas — Hutan Lindung/Konservasi/Produksi], geologi [geology/lithology — rock-type groups: volcanic, limestone, intrusive, alluvium, etc.], ports).
- fly_to — pan/zoom to a region or coordinate.
- filter_opportunities — filter & highlight the featured opportunity pins (by sector, province, commodity, or minimum foreign-ownership %).
- filter_mining — filter, show & zoom the mining layers: IUP concession polygons and/or metal-mineral points, by commodity (coal/nickel/iron) and/or province. It ALREADY turns the layer on and moves the camera to the result, so you do NOT need a separate set_layers or fly_to for mining queries. Examples: "tampilkan IUP batubara di Kalimantan Timur" → filter_mining{dataset:"iup",commodity:"batubara",province:"Kalimantan Timur"}; "lihat konsesi nikel" → filter_mining{dataset:"iup",commodity:"nikel"}; "titik mineral besi" → filter_mining{dataset:"logam",commodity:"besi"}; "hapus filter tambang" → filter_mining{clear:true}.
- filter_kawasan_hutan — show, filter & zoom the forest-area (kawasan hutan) layer. It ALREADY turns the "hutan" layer on and frames the result. Thematic raster-derived data: it carries the forest FUNCTION only (no province / area / company), so never quote per-province area or hectare figures for it. Whenever the user names a place, pass it as the region argument: the map zooms there AND restricts the displayed forest to that region's APPROXIMATE rectangular area (we have no exact province boundaries) — if the user needs precise province limits, note that this is an approximate regional view. Examples: "tampilkan kawasan hutan" → filter_kawasan_hutan{}; "lihat hutan lindung" → filter_kawasan_hutan{fungsi:"lindung"}; "hutan lindung di Papua" → filter_kawasan_hutan{fungsi:"lindung",region:"papua"}; "hutan konservasi di Kalimantan" → filter_kawasan_hutan{fungsi:"konservasi",region:"kalimantan"}; "hapus layer hutan" → filter_kawasan_hutan{clear:true}.
- filter_geologi — show, filter & zoom the geology / lithology (geologi litologi) layer. It ALREADY turns the "geologi" layer on and frames the result. Thematic raster-derived data: it carries a rock-type GROUP only (no province / area / formation name / age), so never quote per-province figures, hectares, formation names or ages for it. Whenever the user names a place, pass it as the region argument: the map zooms there AND restricts the displayed geology to that region's APPROXIMATE rectangular area (we have no exact province boundaries). Examples: "tampilkan geologi" / "jenis batuan" → filter_geologi{}; "lihat batuan gunungapi" → filter_geologi{litologi:"gunungapi"}; "batugamping di Sulawesi" → filter_geologi{litologi:"batugamping",region:"sulawesi"}; "geologi di Kalimantan" → filter_geologi{region:"kalimantan"}; "hapus layer geologi" → filter_geologi{clear:true}.
When the user asks to see, show, zoom to, highlight, filter or focus on something on the map, CALL the matching function instead of only describing it — ALWAYS call a tool, never just describe. For any mining/IUP/concession/coal/nickel/iron request, call filter_mining. You may call several in one turn (e.g. fly_to + filter_opportunities). Only the data layers listed above carry data — wiup/gdp/infra cannot be toggled yet.
How long your text reply should be depends on what the user did:
- A pure COMMAND to act on the map ("tampilkan…", "zoom ke…", "show…", "highlight…", "fokus ke…"): reply with exactly ONE short sentence in the user's language saying what you changed.
- A QUESTION that asks for information ("apa aja…", "ada … apa", "berapa…", "siapa…", "mana yang…", "which/how many/what/who"): STILL call the matching tool to move the map, but ALSO actually ANSWER the question in 2–4 sentences or a short bullet list, grounded in the mining/data figures in your context — give real numbers (counts per commodity, top provinces, total Ha, status breakdown, example company names). Do not just say "I'm showing it on the map"; answer what was asked first, then note you've shown it on the map.
NEVER write JSON, the word "actions", function names, or argument objects in your text; the system applies the calls, your prose is only for the human to read. Use only figures present in your grounding context; do not invent companies or numbers.`;

// Added only when the hilirisasi (value-chain) view enables tree tools. Tells
// the model it can drive the same diagram the user sees (issue #24).
const TREE_TOOLS_INSTRUCTION = `You are looking at the same interactive value-chain (hilirisasi/downstreaming) diagram as the user and can CONTROL it by calling functions:
- set_commodity — switch the tree to another commodity (Nikel/Sawit/Kelapa/Rumput Laut).
- focus_node — pan/zoom to a specific product node and highlight its trade tooltip.
When the user asks to see, show, zoom to, highlight or focus on a product/stage, or to look at another commodity, CALL the matching function instead of only describing it. You may combine set_commodity + focus_node in one turn (switch tree, then focus a node in it). Always also reply with one or two short sentences. Use the node ids/names from the node list in the context.`;

// Added only when the workspace chat enables canvas tools (issue #26 PR-2).
// Lets the assistant pin artifacts onto the project's shared canvas.
const CANVAS_TOOLS_INSTRUCTION = `You share a "canvas" with the user — a side rail that collects artifacts for this project. You can CONTROL it by calling the function:
- add_artifact — pin a card (kind DOC/MODEL/DIAGRAM/MAP) with a title, meta line and optional one-line highlight.
When the user asks you to draft, sketch, build, model, map, summarise or "pin"/"add to canvas" something worth keeping (a regulation summary, a comparables/valuation model, an SPV or process diagram, a site map), CALL add_artifact — you may call it several times for several artifacts. Always ALSO reply with one or two short sentences telling the user what you added. NEVER write JSON, the word "actions", function names or argument objects in your prose; the system applies the calls.`;

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

  const { messages = [], context, lang, mapTools = false, treeTools = false, canvasTools = false } = body;

  // Reply in the user's active UI language (default Bahasa Indonesia). See #8.
  const LANGUAGE_INSTRUCTION = {
    id: "Reply in Bahasa Indonesia. Keep regulation names, figures and proper nouns as-is.",
    en: "Reply in English.",
    zh: "Reply in Simplified Chinese (简体中文). Keep regulation names, figures and proper nouns as-is.",
  };
  const langNote = LANGUAGE_INSTRUCTION[lang] || LANGUAGE_INSTRUCTION.id;

  // The map view passes mapTools:true, the hilirisasi view treeTools:true and
  // the workspace canvasTools:true so the assistant can drive whichever surface
  // the user is on.
  const tools = mapTools === true ? MAP_TOOLS : treeTools === true ? TREE_TOOLS : canvasTools === true ? CANVAS_TOOLS : null;
  const toolsEnabled = tools != null;
  const toolInstruction = mapTools === true ? MAP_TOOLS_INSTRUCTION : treeTools === true ? TREE_TOOLS_INSTRUCTION : canvasTools === true ? CANVAS_TOOLS_INSTRUCTION : null;

  const system = [
    BASE_SYSTEM_PROMPT,
    langNote,
    toolInstruction,
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
    upstream = await callUpstream(chatMessages, tools);
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
                  content: "Applied.",
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
