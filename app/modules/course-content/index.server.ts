import type { Markdown } from "~/lib/text";
import { render } from "./lib/render.server";

/**
 * Renders Markdown an instructor wrote (lesson content, sales copy) to HTML.
 *
 * Raw HTML passes through: the author is trusted. Student-written Markdown
 * goes through `~/lib/comment-markdown.server` instead.
 *
 * The result is wrapped in `.course-content`, which `app/styles/course-content.css`
 * styles: headings, key terms, inline code, and callouts written with
 * GitHub's alert syntax (`> [!TIP]`, `> [!WARNING]`, and our own `> [!KEY]`).
 */
export function renderCourseContent(markdown: Markdown): Promise<string> {
  return render(markdown);
}
