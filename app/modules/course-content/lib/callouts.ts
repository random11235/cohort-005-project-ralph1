/**
 * Callouts use GitHub's alert syntax, so Markdown an instructor wrote for a
 * README renders the same here:
 *
 *     > [!TIP]
 *     > Narrow on `result.ok` first.
 *
 * `KEY` is ours: it marks the one thing a learner must take from a lesson.
 */
const CALLOUT_LABELS = {
  key: "Key point",
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
} as const;

export type CalloutKind = keyof typeof CALLOUT_LABELS;

function isCalloutKind(kind: string): kind is CalloutKind {
  return Object.hasOwn(CALLOUT_LABELS, kind);
}

/**
 * Turns the rendered body of a blockquote into a callout when its first line
 * is a marker such as `[!TIP]`. Returns null for an ordinary blockquote.
 */
export function renderCallout(blockquoteBody: string): string | null {
  const match = /^<p>\[!([a-z]+)\][^\S\n]*(?:<br>\n?|\n|(?=<\/p>))/i.exec(
    blockquoteBody
  );
  if (!match) return null;

  const kind = match[1].toLowerCase();
  if (!isCalloutKind(kind)) return null;

  const content = `<p>${blockquoteBody.slice(match[0].length)}`.replace(
    /^<p><\/p>\n/,
    ""
  );
  const label = CALLOUT_LABELS[kind];
  return `<div class="callout callout-${kind}" role="note" aria-label="${label}">\n<p class="callout-title">${label}</p>\n${content}</div>\n`;
}
