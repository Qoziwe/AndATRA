import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeComparableText = (value: string) =>
  value.replace(/\s+/g, " ").trim().toLocaleLowerCase("ru-RU");

const removeRepeatedHeading = (body: string, heading?: string) => {
  if (!heading) {
    return body.trim();
  }

  const lines = body.split(/\r?\n/);
  const firstMeaningfulIndex = lines.findIndex((line) => line.trim().length > 0);

  if (firstMeaningfulIndex === -1) {
    return "";
  }

  if (
    normalizeComparableText(lines[firstMeaningfulIndex]) === normalizeComparableText(heading)
  ) {
    lines.splice(firstMeaningfulIndex, 1);
  }

  return lines.join("\n").trim();
};

const isSubheadingLine = (line: string) =>
  !/^[-•]\s+/.test(line) && !/^\d+[.)]\s+/.test(line) && line.length <= 72 && !/[.!?]$/.test(line);

const renderLinesHtml = (lines: string[]) => {
  let html = "";
  let bulletItems: string[] = [];

  const flushBulletItems = () => {
    if (!bulletItems.length) {
      return;
    }

    html += `<ul>${bulletItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")}</ul>`;
    bulletItems = [];
  };

  lines.forEach((line) => {
    if (/^[-•]\s+/.test(line)) {
      bulletItems.push(line.replace(/^[-•]\s+/, "").trim());
      return;
    }

    flushBulletItems();
    html += `<p>${escapeHtml(line)}</p>`;
  });

  flushBulletItems();
  return html;
};

const renderSectionHtml = (body: string, heading?: string) => {
  const cleanedBody = removeRepeatedHeading(body, heading);
  if (!cleanedBody) {
    return "";
  }

  const blocks = cleanedBody
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return "";
      }

      if (lines.length > 1 && isSubheadingLine(lines[0])) {
        return `
          <section class="content-section">
            <h2>${escapeHtml(lines[0])}</h2>
            ${renderLinesHtml(lines.slice(1))}
          </section>
        `;
      }

      if (lines.length === 1 && isSubheadingLine(lines[0])) {
        return `
          <section class="content-section">
            <h2>${escapeHtml(lines[0])}</h2>
          </section>
        `;
      }

      return `<section class="content-section">${renderLinesHtml(lines)}</section>`;
    })
    .join("");
};

const createBlobDownload = (filename: string, content: string, mimeType: string) => {
  if (!isWeb || typeof document === "undefined") {
    return false;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};

export const downloadTextFile = (filename: string, content: string) =>
  createBlobDownload(filename, content, "text/plain;charset=utf-8");

export const buildTextTable = (rows: string[][]) => rows.map((row) => row.join(" | ")).join("\n");

export const downloadCsvFile = (filename: string, rows: string[][]) => {
  const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escapeCell).join(",")).join("\n");
  return createBlobDownload(filename, csv, "text/csv;charset=utf-8");
};

export const downloadPdfDocument = (
  title: string,
  sections: Array<{ heading?: string; body: string }>
) => {
  if (!isWeb || typeof window === "undefined") {
    return false;
  }

  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) {
    return false;
  }

  const bodyHtml = sections
    .map((section) => {
      const sectionHeading =
        section.heading &&
        normalizeComparableText(section.heading) !== normalizeComparableText(title)
          ? section.heading
          : undefined;

      return `
        <section class="document-section">
          ${sectionHeading ? `<h2 class="document-section-title">${escapeHtml(sectionHeading)}</h2>` : ""}
          ${renderSectionHtml(section.body, section.heading)}
        </section>
      `
    })
    .join("");

  popup.document.write(`
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            color-scheme: light;
          }
          * {
            box-sizing: border-box;
          }
          @page {
            margin: 16mm 14mm;
          }
          body {
            margin: 0;
            padding: 32px;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #eef3f9;
            color: #10203A;
          }
          .paper {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 42px;
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 24px 60px rgba(16, 32, 58, 0.12);
          }
          h1 {
            margin: 0;
            font-size: 30px;
            line-height: 1.15;
          }
          .meta {
            margin: 10px 0 28px;
            color: #5E738E;
            font-size: 13px;
          }
          .document-section + .document-section {
            margin-top: 28px;
          }
          .document-section-title {
            margin: 0 0 16px;
            font-size: 20px;
            line-height: 1.25;
          }
          .content-section + .content-section {
            margin-top: 18px;
          }
          h2 {
            margin: 0 0 10px;
            font-size: 17px;
            line-height: 1.3;
          }
          p {
            margin: 0 0 10px;
            font-size: 14px;
            line-height: 1.7;
          }
          ul {
            margin: 0;
            padding-left: 20px;
          }
          li {
            margin: 0 0 8px;
            font-size: 14px;
            line-height: 1.65;
          }
          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }
            .paper {
              max-width: none;
              padding: 0;
              border-radius: 0;
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <main class="paper">
          <h1>${escapeHtml(title)}</h1>
          <div class="meta">Документ подготовлен AndATRA ${new Date().toLocaleString("ru-RU")}</div>
          ${bodyHtml}
        </main>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 300);
  return true;
};

export const requestElementFullscreen = (nativeId: string) => {
  if (!isWeb || typeof document === "undefined") {
    return false;
  }

  const element = document.getElementById(nativeId);
  if (!element || !("requestFullscreen" in element)) {
    return false;
  }

  void (element as HTMLElement).requestFullscreen();
  return true;
};
