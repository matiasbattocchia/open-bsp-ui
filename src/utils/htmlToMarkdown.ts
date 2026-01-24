import TurndownService from "turndown";
import DOMPurify from "isomorphic-dompurify";
import he from "he";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*", // Use * for emphasis (italic) to match standard markdown
});

/**
 * Sanitizes HTML to prevent XSS and converts it to Markdown.
 * Useful for converting contenteditable HTML input to safe Markdown for storage/sending.
 */
export function htmlToMarkdown(html: string): string {
  // 1. Decode HTML entities (e.g. &lt;h1&gt; -> <h1>)
  // This allows pasting HTML source code to be converted, and ensures we sanitize the actual tags.
  const decoded = he.decode(html);

  // 2. Sanitize HTML
  const cleanHtml = DOMPurify.sanitize(decoded);

  // 3. Convert to Markdown
  return turndownService.turndown(cleanHtml);
}
