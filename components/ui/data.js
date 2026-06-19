// Shared mock data for the prototype, ported from content/midfi-shared.jsx.
// No backend — every screen reads its demo content from here.

export const DATA = {
  org: { name: "Khazanah Nasional", short: "KN", color: "#2f6a4f" },
  user: { name: "Aisha Tan", short: "AT", color: "#b94a1f", role: "Director, SE Asia" },
  projects: [
    { id: "sni", name: "Nickel Midstream — Sulawesi", short: "SULAWESI.NI", stage: "Diligence", threads: 4, active: true, ticket: "$400M", counter: "MIND ID", sector: "Critical minerals" },
    { id: "nsg", name: "Geothermal — N. Sumatra", short: "NSUMATRA.GEO", stage: "Scoping", threads: 2, active: false },
    { id: "bdc", name: "Data Centers — Batam", short: "BATAM.DC", stage: "Diligence", threads: 7, active: false },
    { id: "wjb", name: "EV Battery JV — W. Java", short: "WJAVA.EVB", stage: "Scoping", threads: 1, active: false },
  ],
  threads: [
    { id: "t1", name: "DNI rules & smelter co-investment", updated: "2m", count: 4, active: true, lastActor: "AI", unread: false },
    { id: "t2", name: "Tax holiday eligibility (Pioneer industry)", updated: "1h", count: 9, active: false, lastActor: "Rina P.", unread: true },
    { id: "t3", name: "Power offtake — PLN terms", updated: "3h", count: 6, active: false, lastActor: "AI", unread: false },
    { id: "t4", name: "ESG / IRMA audit pathway", updated: "yesterday", count: 12, active: false, lastActor: "Adi W.", unread: false },
  ],
  analysts: [
    { name: "Rina Pratiwi", short: "RP", color: "#b94a1f", role: "Sr. Analyst · SE Asia desk", status: "online", focus: "Mining & metals", interactions: 9 },
    { name: "Adi Wibowo", short: "AW", color: "#2f6a4f", role: "Analyst · Energy", status: "online", focus: "Power & utilities", interactions: 3 },
    { name: "Sari Hakim", short: "SH", color: "#7a7466", role: "Legal · BKPM", status: "away", focus: "Regulatory", interactions: 1 },
  ],
  turns: [
    { who: "user", name: "Aisha Tan", time: "14:00", text: "What's the current Negative Investment List position on nickel-related midstream as of Perpres 49/2021? Foreign cap?" },
    { who: "ai", name: "BKPM Assistant", time: "14:00", text: "Smelting & refining of nickel ore is OPEN to 100% foreign ownership under the Positive Investment List, conditional on partnership with national SMEs for any non-core services.", cite: ["Perpres 10/2021 §C(7)", "BKPM Reg. 4/2021 §17"], pin: "Perpres clauses" },
    { who: "user", name: "Aisha Tan", time: "14:01", text: "Got it. Can you sketch the typical co-investment structure with state-owned MIND ID? We'd be looking at minority via convertible." },
    { who: "ai", name: "BKPM Assistant", time: "14:02", text: "Most recent precedents (Vale Indonesia, PT Halmahera Persada Lygend, Konawe) used a 3-tier SPV with offshore HoldCo. Pinned the structure diagram + comp set →", cite: ["Comp set · 4 deals"], pin: "SPV diagram" },
    { who: "ai", name: "BKPM Assistant", time: "14:02", kind: "suggest", text: "Convertible structuring with MIND ID has IC-level nuance — Rina Pratiwi structured the Konawe deal in 2024. Want me to loop her in?" },
  ],
  artifacts: [
    { kind: "DOC", title: "Perpres 10/2021 — Annex II §C(7)", meta: "Regulation · 14 pages", highlight: "100% foreign permitted" },
    { kind: "MODEL", title: "Comp set — 4 nickel midstream deals", meta: "Med EV/EBITDA 6.4× · 2021–2025" },
    { kind: "DIAGRAM", title: "SPV structure (3-tier offshore)", meta: "Auto-generated · 14:02" },
    { kind: "MAP", title: "Sulawesi smelter cluster", meta: "12 active sites · IMIP, IWIP" },
  ],
};

// kind → accent chip class
export const KIND_COLOR = {
  DOC: "chip-terra",
  MODEL: "chip-jade",
  DIAGRAM: "chip-gold",
  MAP: "chip",
};
