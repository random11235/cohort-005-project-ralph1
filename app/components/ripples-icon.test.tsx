import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RipplesIcon } from "~/components/ripples-icon";

function rings(markup: string) {
  return [...markup.matchAll(/<circle ([^>]*)>/g)].map(([, attrs]) => ({
    cx: attrs.match(/cx="([^"]*)"/)?.[1],
    cy: attrs.match(/cy="([^"]*)"/)?.[1],
    r: Number(attrs.match(/ r="([^"]*)"/)?.[1]),
    opacity: Number(attrs.match(/stroke-opacity="([^"]*)"/)?.[1]),
  }));
}

describe("RipplesIcon", () => {
  it("draws rings around one centre, each wider and fainter than the last", () => {
    const drawn = rings(renderToStaticMarkup(<RipplesIcon />));

    expect(drawn.length).toBeGreaterThanOrEqual(3);
    for (const ring of drawn) expect([ring.cx, ring.cy]).toEqual(["12", "12"]);
    for (let i = 1; i < drawn.length; i++) {
      expect(drawn[i].r).toBeGreaterThan(drawn[i - 1].r);
      expect(drawn[i].opacity).toBeLessThan(drawn[i - 1].opacity);
    }
  });

  it("stays inside lucide's 24×24 grid", () => {
    const markup = renderToStaticMarkup(<RipplesIcon />);

    expect(markup).toContain('viewBox="0 0 24 24"');
    for (const ring of rings(markup)) expect(ring.r).toBeLessThanOrEqual(11);
  });

  it("is decorative and takes the colour of the text around it", () => {
    const markup = renderToStaticMarkup(<RipplesIcon />);

    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('stroke="currentColor"');
    expect(markup).toContain('fill="none"');
  });

  it("is sized by the className it is given", () => {
    const markup = renderToStaticMarkup(<RipplesIcon className="size-4" />);

    expect(markup).toContain('class="size-4"');
  });
});
