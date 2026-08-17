import TurndownService from "turndown";
import DOMPurify from "isomorphic-dompurify";
import he from "he";
import { Remarkable } from "remarkable";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*", // Use * for emphasis (italic) to match standard markdown
  // Contenteditable Shift+Enter / Enter inserts <br>. Use plain newlines —
  // CommonMark hard breaks ("  \n" / "\\\n") are wrong for WhatsApp chat.
  br: "",
});

// Keep literal WhatsApp markers (*bold*, _italic_, etc.). Default escape()
// turns "*6300" into "\*6300", which is what the contact sees.
turndownService.escape = (string) => string;

// Contenteditable wraps each line in a <div>. Turndown's default block rule
// emits paragraph breaks ("\n\n"); chat lines should be single newlines.
turndownService.addRule("contentEditableLine", {
  filter: "div",
  replacement(content, node) {
    const text = content.replace(/^\n+|\n+$/g, "");
    // Empty line (e.g. <div><br></div>). Use "\n\n" so turndown's join()
    // keeps a blank line instead of collapsing with the next prefix "\n".
    if (!text) {
      return "\n\n";
    }
    const prefix = node.previousSibling ? "\n" : "";
    return prefix + text;
  },
});

function isBoldFontWeight(weight: string): boolean {
  const w = weight.trim().toLowerCase();
  if (w === "bold" || w === "bolder") return true;
  const n = parseInt(w, 10);
  return !Number.isNaN(n) && n >= 600;
}

/** Strip outer ** / __ so re-bolding a draft can't stack into ****text****. */
function unwrapOuterBoldMarkers(content: string): string {
  let s = content.trim();
  for (;;) {
    const next = s
      .replace(/^\*\*(?![\s*])([\s\S]*?)(?<![\s*])\*\*$/, "$1")
      .replace(/^__(?![\s_])([\s\S]*?)(?<![\s_])__$/, "$1");
    if (next === s) break;
    s = next.trim();
  }
  return s;
}

function wrapBold(content: string): string {
  const inner = unwrapOuterBoldMarkers(content);
  return inner ? `**${inner}**` : content;
}

turndownService.addRule("strong", {
  filter: ["strong", "b"],
  replacement: (content) => wrapBold(content),
});

// Pastes often use font-weight spans instead of <b>/<strong>. Those look
// bold in the editor but Turndown would otherwise emit plain text.
turndownService.addRule("boldFontWeight", {
  filter(node) {
    if (node.nodeName !== "SPAN" && node.nodeName !== "FONT") return false;
    return isBoldFontWeight(
      (node as HTMLElement).style?.fontWeight ||
        node.getAttribute("style")?.match(/font-weight:\s*([^;]+)/i)?.[1] ||
        "",
    );
  },
  replacement: (content) => wrapBold(content),
});

function wrapBoldPerLine(inner: string): string {
  return inner
    .split("\n")
    .map((line) => {
      const match = line.match(/^(\s*)(.*?)(\s*)$/);
      if (!match) return line;
      const [, lead, mid, trail] = match;
      const core = unwrapOuterBoldMarkers(mid);
      if (!core) return line;
      return `${lead}**${core}**${trail}`;
    })
    .join("\n");
}

/** Collapse stacked/unbalanced markers and split multiline ** so WhatsApp
 * (same-line bold only) gets a valid *bold* per line. */
function normalizeComposerMarkdown(text: string): string {
  let s = text.replace(/\*{3,}(?![\s*])([\s\S]*?)(?<![\s*])\*{3,}/g, "**$1**");
  s = s.replace(
    /(^|[^*])\*(?!\*)(?![\s*])([^*]+?)(?<![\s*])\*\*/g,
    (_, pre, inner) => `${pre}**${inner}**`,
  );
  s = s.replace(/\*\*(?![\s*])([^*]+?)(?<![\s*])\*(?!\*)/g, "**$1**");
  return s.replace(
    /\*\*(?![\s*])([\s\S]+?)(?<![\s*])\*\*/g,
    (_match, inner: string) =>
      inner.includes("\n") ? wrapBoldPerLine(inner) : `**${inner}**`,
  );
}

/**
 * Sanitizes HTML to prevent XSS and converts it to Markdown.
 * Useful for converting contenteditable HTML input to safe Markdown for storage/sending.
 */
export function htmlToMarkdown(html: string): string {
  const decoded = he.decode(html);
  const cleanHtml = DOMPurify.sanitize(decoded);
  return normalizeComposerMarkdown(turndownService.turndown(cleanHtml));
}

const editableMd = new Remarkable({
  breaks: true,
  html: false,
});

/**
 * CommonMark → HTML for the contenteditable composer.
 * Drafts are stored as markdown (`**bold**`); restoring via textContent shows
 * literal asterisks and re-applying bold stacks them. Restore as HTML instead.
 */
export function markdownToEditableHtml(markdown: string): string {
  if (!markdown) return "";

  const rendered = editableMd
    .render(normalizeComposerMarkdown(markdown))
    .trim()
    .replace(/<p>/g, "<div>")
    .replace(/<\/p>/g, "</div>");

  return DOMPurify.sanitize(rendered, {
    ALLOWED_TAGS: ["div", "br", "strong", "em", "del", "s", "code", "pre", "a"],
    ALLOWED_ATTR: ["href"],
  });
}
