import type { SVGProps } from "react";

// Ripples from a pebble dropped in water: the Notification Feed's glyph, in
// place of a bell, which read as an alarm. Lucide has no ripple, so this is
// drawn on lucide's 24×24 grid in currentColor to sit beside its icons. The
// rings fade outward, which is what keeps it from reading as a target.
const RIPPLE_RINGS = [
  { r: 2.5, opacity: 1 },
  { r: 6.25, opacity: 0.7 },
  { r: 10, opacity: 0.4 },
] as const;

export function RipplesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
      {...props}
    >
      {RIPPLE_RINGS.map(({ r, opacity }) => (
        <circle key={r} cx={12} cy={12} r={r} strokeOpacity={opacity} />
      ))}
    </svg>
  );
}
