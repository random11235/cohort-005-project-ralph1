import { renderCourseContent } from "~/modules/course-content/index.server";
import type { Markdown } from "~/lib/text";

// Kept so the lesson route and the course sales page, both over the file-size
// limit and not editable until they are split, need no change. New code imports
// renderCourseContent from the course-content module directly.
export function renderMarkdown(markdown: Markdown): Promise<string> {
  return renderCourseContent(markdown);
}
