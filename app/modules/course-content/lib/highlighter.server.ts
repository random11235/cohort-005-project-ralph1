import { type Highlighter, createHighlighter } from "shiki";

const THEME = "github-dark";

let highlighter: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({
    themes: [THEME],
    langs: [
      "typescript",
      "javascript",
      "json",
      "bash",
      "html",
      "css",
      "tsx",
      "jsx",
      "sql",
      "yaml",
      "markdown",
      "text",
      "plaintext",
    ],
  });
  return highlighter;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function loadCodeHighlighter(): Promise<
  (code: string, lang: string | undefined) => string
> {
  const hl = await getHighlighter();
  return (code, lang) => {
    try {
      return hl.codeToHtml(code, { lang: lang || "text", theme: THEME });
    } catch {
      // shiki throws for a language it was not loaded with.
      return `<pre><code>${escapeHtml(code)}</code></pre>`;
    }
  };
}
