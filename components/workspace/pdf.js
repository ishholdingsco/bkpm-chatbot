// Minimal, dependency-free PDF generator for the prototype (issue #26 PR-2).
// Enough to make the canvas "Download PDF" button produce a real, openable file
// without pulling in a PDF library. Renders a list of text lines on one A4 page
// in Helvetica. Not a general-purpose writer — just branded one-pagers.

// Escape the few characters that are special inside a PDF string literal, and
// drop anything outside printable ASCII (Helvetica/WinAnsi can't render it).
function escapeText(s) {
  return String(s)
    .replace(/[\\()]/g, (c) => "\\" + c)
    .replace(/[^\x20-\x7E]/g, "?");
}

// Hard-wrap a string to at most `max` characters per line, on word boundaries.
export function wrap(text, max = 92) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if ((line + " " + w).length <= max) line += " " + w;
    else { out.push(line); line = w; }
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

// Build a one-page PDF from `lines` (each { text, size?, gap? }) → a PDF string.
function buildPdf(lines) {
  let content = "BT\n";
  let first = true;
  for (const ln of lines) {
    const size = ln.size || 11;
    content += `/F1 ${size} Tf\n`;
    if (first) { content += `1 0 0 1 50 800 Tm\n`; first = false; }
    else { content += `0 ${-(ln.gap || size + 6)} Td\n`; }
    content += `(${escapeText(ln.text)}) Tj\n`;
  }
  content += "ET";

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets[i + 1] = pdf.length;
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
}

// Trigger a browser download of `lines` as `filename`.pdf.
export function downloadPdf(filename, lines) {
  const blob = new Blob([buildPdf(lines)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.toLowerCase().endsWith(".pdf") ? filename : filename + ".pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
