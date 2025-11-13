import { describe, expect, it } from "vitest";

import { mdToHtml } from "../markdown";

describe("mdToHtml", () => {
  it("formats headings, emphasis, and lists", () => {
    const html = mdToHtml(`# Title\n\n## Subtitle\n\n- item **bold**\n- item *italic*\n`);

    expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
    expect(html).toMatch(/<h2[^>]*>Subtitle<\/h2>/);
    expect(html).toMatch(/<ul[^>]*>.*<li[^>]*>item <strong[^>]*>bold<\/strong><\/li>/s);
    expect(html).toMatch(/<li[^>]*>item <em>italic<\/em><\/li>/);
  });

  it("renders tables with headers and rows", () => {
    const table = `| Col 1 | Col 2 |\n| ----- | ----- |\n| A | B |\n| C | D |\n`;
    const html = mdToHtml(table);

    expect(html).toMatch(/<table[^>]*>/);
    expect(html).toMatch(/<th[^>]*>Col 1<\/th>/);
    expect(html).toMatch(/<td[^>]*>B<\/td>/);
  });

  it("converts code blocks and escapes raw html", () => {
    const source = '```\nconsole.log("hi");\n```\n\n<script>alert(1)</script>';
    const html = mdToHtml(source);

    expect(html).toMatch(/<pre[^>]*><code>[\s\S]*console\.log\(&quot;hi&quot;\);/);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
