import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const imagesFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/images"
);

const COVERS = ["course-nodejs.svg", "course-typescript.svg"];
const OLD_FLAT_BRAND_COLOURS = ["#339933", "#3178c6"];

const readCover = (file: string) =>
  readFileSync(path.join(imagesFolder, file), "utf8");

const backgroundFill = (svg: string) =>
  svg.match(/<rect\b[^>]*\bfill="([^"]+)"/)?.[1];

describe.each(COVERS)("placeholder cover %s", (file) => {
  const svg = readCover(file);

  it("keeps the 800x400 frame the course cards expect", () => {
    expect(svg).toMatch(/viewBox="0 0 800 400"/);
  });

  it("paints its background with a gradient, not a flat colour", () => {
    const gradientId = backgroundFill(svg)?.match(/^url\(#(.+)\)$/)?.[1];

    expect(gradientId).toBeDefined();
    expect(svg).toMatch(
      new RegExp(`<(linear|radial)Gradient\\b[^>]*\\bid="${gradientId}"`)
    );
  });

  it("drops the flat Node.js and TypeScript brand colours", () => {
    for (const colour of OLD_FLAT_BRAND_COLOURS) {
      expect(svg.toLowerCase()).not.toContain(colour);
    }
  });
});
