import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COVERS = ["course-nodejs.svg", "course-typescript.svg"];
const OLD_FLAT_BRAND_COLOURS = ["#339933", "#3178c6"];

const readCover = (file: string) =>
  readFileSync(join(process.cwd(), "public/images", file), "utf8");

describe.each(COVERS)("placeholder cover %s", (file) => {
  const svg = readCover(file);

  it("keeps the 800x400 frame the course cards expect", () => {
    expect(svg).toMatch(/viewBox="0 0 800 400"/);
  });

  it("paints its background with a gradient, not a flat colour", () => {
    expect(svg).toMatch(/<linearGradient id="sky"/);
    expect(svg).toMatch(/<rect width="800" height="400" fill="url\(#sky\)"\/>/);
  });

  it("drops the flat Node.js and TypeScript brand colours", () => {
    for (const colour of OLD_FLAT_BRAND_COLOURS) {
      expect(svg.toLowerCase()).not.toContain(colour);
    }
  });
});
