import { Marked } from "marked";
import type { Markdown } from "~/lib/text";
import { renderCallout } from "./lib/callouts";
import { loadCodeHighlighter } from "./lib/highlighter.server";

/**
 * Renders Markdown an instructor wrote (lesson content, sales copy) to HTML.
 *
 * Raw HTML passes through: the Instructor is trusted. Student-written Markdown
 * goes through `~/lib/comment-markdown.server` instead.
 *
 * The result is wrapped in `.course-content`, which `app/styles/course-content.css`
 * styles: headings, key terms, inline code, and callouts written with
 * GitHub's alert syntax (`> [!TIP]`, `> [!WARNING]`, and our own `> [!KEY]`).
 */
export async function renderCourseContent(markdown: Markdown): Promise<string> {
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
  return `<div class="course-content">\n${html}</div>\n`;
}
