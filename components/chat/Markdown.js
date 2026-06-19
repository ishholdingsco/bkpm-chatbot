"use client";
// Renders assistant chat replies (which often contain Markdown — headings,
// lists, **bold**, `code`, links, GFM tables) instead of showing raw "##" text.
// Used by both chat surfaces: the map sidebar ("Ask Nusantara", MapScreens) and
// the workspace thread (ChatTurn). Streaming works for free: react-markdown
// re-parses on every content update as tokens arrive.
//
// Scale is kept small and aligned to the BKPM design tokens — headings are only
// slightly larger than body text so a chat bubble never looks like a webpage.
// The actual element styling lives in the `.md` block of app/midfi-styles.css.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Links open in a new tab; everything else falls through to the styled defaults.
const COMPONENTS = {
  a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
};

export function Markdown({ children }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children || ""}
      </ReactMarkdown>
    </div>
  );
}
