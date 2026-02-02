/*  src/lib/markdown.ts
 *  ------------------------------------------------------------------
 *  Markdown helpers shared across node components.
 *  Currently used by TextInfoNode for rendering markdown content.
 *  ------------------------------------------------------------------ */

const H1 = /^# (.+)$/gm;
const H2 = /^## (.+)$/gm;
const H3 = /^### (.+)$/gm;
const BOLD = /\*\*(.+?)\*\*/g;
const ITALIC = /\*(.+?)\*/g;
const LINK = /\[(.+?)\]\((.+?)\)/g;
const CODE = /`(.+?)`/g;
const CODE_BLOCK = /```([\s\S]*?)```/g;
const TABLE = /^(\|[^\n]+\|)\n(\|[-:\s|]+\|)(\n\|[^\n]+\|)*$/gm;

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x20;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x2D;/g, "-")
    .replace(/&#x2F;/g, "/")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function escapeHtml(str: string): string {
  const decoded = decodeHtmlEntities(str);
  return decoded
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const ALLOWED_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function sanitizeLinkUrl(rawUrl: string): string | null {
  const decoded = decodeHtmlEntities(rawUrl);
  const trimmed = decoded.trim();

  if (!trimmed) return null;

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../")
  ) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, "https://rawbit.local");
    if (ALLOWED_LINK_PROTOCOLS.has(parsed.protocol)) {
      return trimmed;
    }
  } catch {
    return null;
  }

  return null;
}

export function parseTable(tableText: string): string {
  const lines = tableText.trim().split("\n");
  if (lines.length < 2) return tableText;

  const separatorLine = lines[1];
  if (!separatorLine.includes("|") || !separatorLine.match(/[-|]+/)) {
    return tableText;
  }

  let html =
    '<table class="border border-border" style="border-collapse:collapse;width:100%;margin:6px 0;font-size:0.92em">';

  const headerCells = lines[0].split("|").filter((cell) => cell.trim());
  html += "<thead><tr>";
  headerCells.forEach((cell) => {
    html += `<th class="border border-border bg-muted" style="padding:8px;text-align:left;font-weight:600">${cell.trim()}</th>`;
  });
  html += "</tr></thead>";

  if (lines.length > 2) {
    html += "<tbody>";
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split("|").filter((cell) => cell.trim());
      if (cells.length > 0) {
        html += "<tr>";
        cells.forEach((cell) => {
          html += `<td class="border border-border" style="padding:8px">${cell.trim()}</td>`;
        });
        html += "</tr>";
      }
    }
    html += "</tbody>";
  }

  html += "</table>";
  return html;
}

export function parseLists(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let i = 0;

  const ul = (item: string) => `<li style="margin:0.18em 0">${item}</li>`;
  const ol = (item: string) => `<li style="margin:0.18em 0">${item}</li>`;

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*[-*]\s+/.test(line)) {
      html +=
        '<ul style="list-style-type:disc;margin:0.35em 0 0.6em;padding-left:1.5em">';
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        html += ul(lines[i].replace(/^\s*[-*]\s+/, "").trim());
        i++;
      }
      html += "</ul>";
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      html +=
        '<ol style="list-style-type:decimal;margin:0.35em 0 0.6em;padding-left:1.5em">';
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        html += ol(lines[i].replace(/^\s*\d+\.\s+/, "").trim());
        i++;
      }
      html += "</ol>";
      continue;
    }

    html += lines[i] + "\n";
    i++;
  }
  return html;
}

export function wrapParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^<\s*(h1|h2|h3|ul|ol|pre|table|blockquote)\b/i.test(block)) {
        return block;
      }
      return `<p style="margin:0.3em 0 0.55em">${block}</p>`;
    })
    .join("");
}

export function mdToHtml(src: string): string {
  let result = escapeHtml(src);

  result = result.replace(TABLE, (match) => parseTable(match));

  result = result.replace(CODE_BLOCK, (_, content) => {
    return `<pre class="border border-border bg-muted/60 text-foreground" style="display:block;border-radius:6px;padding:12px;margin:0.6em 0;overflow-x:auto;font-family:'JetBrains Mono','Fira Code',SFMono-Regular,monospace;font-size:0.9em;line-height:1.45"><code>${content}</code></pre>`;
  });

  result = result
    .replace(
      H1,
      "<h1 style=\"font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:1.35em;margin:0.6em 0 0.15em\">$1</h1>"
    )
    .replace(
      H2,
      "<h2 style=\"font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:1.18em;margin:0.8em 0 0.15em\">$1</h2>"
    )
    .replace(
      H3,
      "<h3 style=\"font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:1.08em;margin:0.6em 0 0.12em\">$1</h3>"
    );

  result = parseLists(result);

  result = result
    .replace(BOLD, '<strong style="font-weight:600">$1</strong>')
    .replace(ITALIC, "<em>$1</em>")
    .replace(LINK, (_, text, url) => {
      const safeUrl = sanitizeLinkUrl(url);
      if (!safeUrl) {
        return `<span class="text-primary underline underline-offset-2">${text}</span>`;
      }
      return `<a href="${escapeHtml(safeUrl)}" class="text-primary underline underline-offset-2 hover:opacity-90" target="_blank" rel="noopener noreferrer">${text}</a>`;
    })
    .replace(CODE, (_, content) => {
      return `<code class="bg-muted/60 text-foreground" style="font-family:'JetBrains Mono','Fira Code',SFMono-Regular,monospace;padding:0 0.25em;border-radius:4px">${content}</code>`;
    });

  result = wrapParagraphs(result);

  return result;
}
