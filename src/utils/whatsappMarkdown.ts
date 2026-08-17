/**
 * Chat-bubble rendering of stored CommonMark as WhatsApp would show it.
 * (*bold*  _italic_  ~strikethrough~  ```code```  `inline`)
 */

const BOLD_SENTINEL = "\u0002";

function outsideCode(text: string, fn: (part: string) => string): string {
  return text
    .split(/(`{3}[\s\S]*?`{3})/)
    .map((part) => {
      if (part.startsWith("```")) return part;
      return part
        .split(/(`[^`\n]+`)/)
        .map((subPart) => (subPart.startsWith("`") ? subPart : fn(subPart)))
        .join("");
    })
    .join("");
}

/** Same-line **bold** / __bold__ → *bold*. Does not repair stacked leftovers
 * (*text**, ***text***); those stay visible like on the contact's phone. */
function markdownToWhatsApp(text: string): string {
  return outsideCode(text, (part) => {
    let processed = part.replace(
      /^#+\s+(.*)$/gm,
      `${BOLD_SENTINEL}$1${BOLD_SENTINEL}`,
    );
    processed = processed.replace(
      /\*\*(?![\s*])(.+?)(?<![\s*])\*\*/g,
      `${BOLD_SENTINEL}$1${BOLD_SENTINEL}`,
    );
    processed = processed.replace(
      /__(?![\s_])(.+?)(?<![\s_])__/g,
      `${BOLD_SENTINEL}$1${BOLD_SENTINEL}`,
    );
    processed = processed.replace(/~~(?![\s~])(.+?)(?<![\s~])~~/g, "~$1~");
    return processed.replaceAll(BOLD_SENTINEL, "*");
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isAlphanumeric(ch: string): boolean {
  return /\p{L}|\p{N}/u.test(ch);
}

/** WhatsApp: a marker cannot sit next to another of the same kind. */
function isOpen(text: string, i: number, marker: string): boolean {
  const next = text[i + 1] ?? "";
  if (!next || next === marker || /\s/.test(next)) return false;
  const prev = i === 0 ? "" : text[i - 1]!;
  if (prev === marker) return false;
  return !prev || !isAlphanumeric(prev);
}

function isClose(text: string, i: number, marker: string): boolean {
  const prev = i === 0 ? "" : text[i - 1]!;
  if (!prev || prev === marker || /\s/.test(prev)) return false;
  const next = text[i + 1] ?? "";
  if (next === marker) return false;
  return !next || !isAlphanumeric(next);
}

function applyMarker(
  text: string,
  marker: "*" | "_" | "~",
  open: string,
  close: string,
): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === marker && isOpen(text, i, marker)) {
      let closeAt = -1;
      for (let j = i + 1; j < text.length && text[j] !== "\n"; j++) {
        if (text[j] === marker && isClose(text, j, marker)) {
          closeAt = j;
          break;
        }
      }
      if (closeAt !== -1) {
        out += open + text.slice(i + 1, closeAt) + close;
        i = closeAt + 1;
        continue;
      }
    }
    out += text[i];
    i++;
  }
  return out;
}

function whatsappToHtml(text: string): string {
  const B = "\uE000";
  const I = "\uE001";
  const S = "\uE002";
  const bEnd = "\uE003";
  const iEnd = "\uE004";
  const sEnd = "\uE005";

  return text
    .split(/(`{3}[\s\S]*?`{3})/)
    .map((part) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        return `<pre><code>${escapeHtml(part.slice(3, -3).replace(/^\n/, ""))}</code></pre>`;
      }

      return part
        .split(/(`[^`\n]+`)/)
        .map((sub) => {
          if (sub.startsWith("`") && sub.endsWith("`") && sub.length >= 2) {
            return `<code>${escapeHtml(sub.slice(1, -1))}</code>`;
          }

          let s = applyMarker(sub, "*", B, bEnd);
          s = applyMarker(s, "_", I, iEnd);
          s = applyMarker(s, "~", S, sEnd);
          s = escapeHtml(s);

          return s
            .replaceAll(B, "<strong>")
            .replaceAll(bEnd, "</strong>")
            .replaceAll(I, "<em>")
            .replaceAll(iEnd, "</em>")
            .replaceAll(S, "<del>")
            .replaceAll(sEnd, "</del>")
            .replace(/[*_~]/g, '<span dir="ltr">$&</span>');
        })
        .join("");
    })
    .join("")
    .replace(/\n/g, "<br>\n");
}

export function chatMarkdownToHtml(markdown: string): string {
  return whatsappToHtml(markdownToWhatsApp(markdown));
}

export function chatTextDirection(text: string): "rtl" | "ltr" {
  const letters = text.replace(/[^\p{L}]/gu, "");
  if (!letters) return "ltr";
  const rtl = (letters.match(/\p{Script=Hebrew}|\p{Script=Arabic}/gu) || [])
    .length;
  return rtl * 2 >= letters.length ? "rtl" : "ltr";
}
