import { renderCourseContent } from "~/modules/course-content/index.server";
import type { Markdown } from "~/lib/text";

// Kept so the lesson route, which is over the file-size limit and cannot be
// edited until it is split, needs no change. New code imports
// renderCourseContent from the course-content module directly.
export function renderMarkdown(markdown: Markdown): Promise<string> {
  return renderCourseContent(markdown);
}
