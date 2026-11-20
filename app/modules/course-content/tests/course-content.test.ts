import { describe, expect, it } from "vitest";
import { markdown } from "~/lib/text";
import { renderCourseContent } from "../index.server";

const render = (text: string) => renderCourseContent(markdown(text));

describe("renderCourseContent", () => {
  it("wraps the content so the course-content styles apply", async () => {
    expect(await render("Hello")).toBe(
      '<div class="course-content">\n<p>Hello</p>\n</div>\n'
    );
  });

  it("renders headings, emphasis and lists as Markdown", async () => {
    const html = await render("## Title\n\nA **key term**.\n\n- one\n- two");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>key term</strong>");
    expect(html).toContain("<li>one</li>");
  });

  it("lets the instructor's raw HTML through", async () => {
    expect(await render('<span class="x">hi</span>')).toContain(
      '<span class="x">hi</span>'
    );
  });

  describe("callouts", () => {
    it.each([
      ["KEY", "key", "Key point"],
      ["NOTE", "note", "Note"],
      ["TIP", "tip", "Tip"],
      ["IMPORTANT", "important", "Important"],
      ["WARNING", "warning", "Warning"],
      ["CAUTION", "caution", "Caution"],
    ])(
      "turns > [!%s] into a labelled %s callout",
      async (marker, kind, label) => {
        const html = await render(`> [!${marker}]\n> Read **this**.`);
        expect(html).toBe(
          `<div class="course-content">\n<div class="callout callout-${kind}" role="note" aria-label="${label}">\n<p class="callout-title">${label}</p>\n<p>Read <strong>this</strong>.</p>\n</div>\n</div>\n`
        );
      }
    );

    it("accepts a lower-case marker", async () => {
      expect(await render("> [!tip]\n> Hi")).toContain(
        '<div class="callout callout-tip"'
      );
    });

    it("drops the empty paragraph a marker on its own paragraph leaves", async () => {
      const html = await render("> [!NOTE]\n>\n> First.\n>\n> Second.");
      expect(html).toContain(
        '<p class="callout-title">Note</p>\n<p>First.</p>\n<p>Second.</p>\n</div>'
      );
    });

    it("keeps trailing spaces after the marker out of the content", async () => {
      expect(await render("> [!TIP]   \n> Hi")).toContain(
        '<p class="callout-title">Tip</p>\n<p>Hi</p>'
      );
    });

    it("leaves an ordinary blockquote alone", async () => {
      expect(await render("> Just a quote")).toContain(
        "<blockquote>\n<p>Just a quote</p>\n</blockquote>"
      );
    });

    it("leaves a blockquote with an unknown marker alone", async () => {
      const html = await render("> [!SHOUT]\n> Hi");
      expect(html).toContain("<blockquote>");
      expect(html).toContain("[!SHOUT]");
      expect(html).not.toContain("callout");
    });

    it("needs the marker at the start of the blockquote", async () => {
      const html = await render("> Hello [!TIP]\n> Hi");
      expect(html).toContain("<blockquote>");
      expect(html).not.toContain("callout");
    });

    it("ignores a marker that is not the blockquote's first line", async () => {
      const html = await render("> Intro\n>\n> [!TIP]\n> Hi");
      expect(html).toContain("<blockquote>");
      expect(html).not.toContain("callout");
    });

    it("keeps an empty paragraph the instructor wrote further down", async () => {
      const html = await render("> [!TIP]\n> Hi\n>\n> <p></p>\n>\n> Bye");
      expect(html).toContain("<p>Hi</p>\n<p></p>\n");
    });

    it("needs the marker on a line of its own", async () => {
      const html = await render("> [!TIP] Hi");
      expect(html).toContain("<blockquote>");
      expect(html).not.toContain("callout");
    });

    it("does not treat an inherited property name as a kind", async () => {
      const html = await render("> [!constructor]\n> Hi");
      expect(html).not.toContain("callout");
    });
  });

  describe("code blocks", () => {
    it("highlights a known language", async () => {
      const html = await render("```ts\nconst a = 1;\n```");
      expect(html).toContain('<pre class="shiki github-dark"');
      expect(html).toContain("const");
    });

    it.each([
      "typescript",
      "javascript",
      "json",
      "bash",
      "html",
      "css",
      "tsx",
      "jsx",
      "sql",
      "yaml",
      "markdown",
      "text",
      "plaintext",
    ])("highlights %s", async (lang) => {
      const html = await render(`\`\`\`${lang}\nx\n\`\`\``);
      expect(html).toContain('<pre class="shiki github-dark"');
    });

    it("highlights a block with no language as text", async () => {
      const html = await render("```\nplain <b>\n```");
      expect(html).toContain('<pre class="shiki github-dark"');
      expect(html).toContain("plain &#x3C;b>");
    });

    it("falls back to an escaped block for a language it did not load", async () => {
      const html = await render("```cobol\na < b && c > d\n```");
      expect(html).toContain(
        "<pre><code>a &lt; b &amp;&amp; c &gt; d</code></pre>"
      );
    });
  });
});
