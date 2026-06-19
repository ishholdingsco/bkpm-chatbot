// Streaming chat proxy to DeepSeek (OpenAI-compatible). The API key stays
// server-side and is never exposed to the browser.

export const runtime = "nodejs";

import realization from "@/data/investment-realization.json";
import sectors from "@/data/sectors.json";
import economic from "@/data/economic-indicators.json";
import hazard from "@/data/hazard.json";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

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

  const { messages = [], context } = body;
  const system = context ? `${BASE_SYSTEM_PROMPT}\n\nCurrent context: ${context}` : BASE_SYSTEM_PROMPT;

  const chatMessages = [
    { role: "system", content: system },
    ...messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
      .map((m) => ({ role: m.role, content: String(m.content) })),
  ];

  let upstream;
  try {
    upstream = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: true,
        temperature: 0.6,
      }),
    });
  } catch (err) {
    return new Response("Failed to reach DeepSeek API.", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return new Response(`DeepSeek API error (${upstream.status}). ${detail}`.trim(), {
      status: 502,
    });
  }

  // Parse DeepSeek's SSE stream and re-emit just the delta text as a plain
  // text stream — simplest possible contract for the client.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      try {
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
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // ignore partial / non-JSON keepalive lines
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
