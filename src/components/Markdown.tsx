"use client";

import { useMemo } from "react";

interface MarkdownProps {
  content: string;
  className?: string;
}

// Lightweight markdown renderer — no heavy deps, no performance hit
export function Markdown({ content, className = "" }: MarkdownProps) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return (
    <div
      className={`md-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // consume closing ```
      result.push(
        `<div class="code-block"><div class="code-lang">${escapeHtml(lang)}</div><pre><code class="lang-${escapeHtml(lang)}">${escapeHtml(codeLines.join("\n"))}</code></pre></div>`
      );
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h3) { result.push(`<h3>${inlineFormat(h3[1])}</h3>`); i++; continue; }
    if (h2) { result.push(`<h2>${inlineFormat(h2[1])}</h2>`); i++; continue; }
    if (h1) { result.push(`<h1>${inlineFormat(h1[1])}</h1>`); i++; continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      result.push("<hr />");
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].slice(2))}</li>`);
        i++;
      }
      result.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li>${inlineFormat(lines[i].replace(/^\d+\. /, ""))}</li>`);
        i++;
      }
      result.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      result.push(`<blockquote>${inlineFormat(line.slice(2))}</blockquote>`);
      i++;
      continue;
    }

    // Empty line → paragraph break
    if (line.trim() === "") {
      result.push("<br />");
      i++;
      continue;
    }

    // Paragraph
    result.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  return result.join("");
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Strikethrough
    .replace(/~~(.+?)~~/g, "<s>$1</s>");
}
