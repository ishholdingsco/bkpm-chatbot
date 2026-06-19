// Streaming chat proxy to DeepSeek (OpenAI-compatible). The API key stays
// server-side and is never exposed to the browser.

export const runtime = "nodejs";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

const BASE_SYSTEM_PROMPT = `You are "Nusantara", the AI investment analyst inside Wilaya — an investment-intelligence platform built for Indonesia's Investment Ministry / BKPM.

You help foreign and domestic investors understand opportunities in Indonesia: industrial estates (Kawasan Industri), Special Economic Zones (KEK), sectors (critical minerals & nickel midstream, renewable/geothermal energy, data centers, EV battery, manufacturing, aquaculture, tourism), regulations (Positive/Negative Investment List, Perpres 10/2021, tax holidays, DNI rules), ownership caps, incentives, and deal structuring.

Style:
- Be concise, precise and confident, like a sell-side analyst briefing a director.
- Use concrete figures, sectors and regions where helpful.
- When you reference a regulation or data source, name it inline (e.g. "Perpres 10/2021", "BKPM realisasi 2024"). Do not fabricate specific clause numbers you are unsure of — keep them plausible and clearly framed.
- Prefer short paragraphs and tight bullet lists.
- This is a prototype/demo; if asked something outside Indonesian investment, answer briefly and steer back.`;

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
        // eslint-disable-next-line no-constant-condition
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
