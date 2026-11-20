import { Marked } from "marked";
import type { Markdown } from "~/lib/text";
import { renderCallout } from "./callouts";
import { loadCodeHighlighter } from "./highlighter.server";

export const CONTENT_CLASS = "course-content";

export async function render(markdown: Markdown): Promise<string> {
  const highlight = await loadCodeHighlighter();

  const marked = new Marked({
    renderer: {
      code: ({ text, lang }) => highlight(text, lang),
      blockquote({ tokens }) {
        return renderCallout(this.parser.parse(tokens)) ?? false;
      },
    },
  });

  const html = await marked.parse(markdown);
  return `<div class="${CONTENT_CLASS}">\n${html}</div>\n`;
}
