#!/usr/bin/env node

/**
 * Notion Help Center → Markdown Scraper
 * ──────────────────────────────────────
 * 1. Fetches the sitemap at notion.com/help/sitemap.xml
 * 2. Extracts every help-article URL
 * 3. Fetches each page, pulls out the article body
 * 4. Saves each article as a clean .md file in ./output/
 *
 * Usage:
 *   node scrape.mjs                  # scrape everything
 *   node scrape.mjs --limit 5        # scrape only 5 articles (for testing)
 *   node scrape.mjs --delay 2000     # 2 s between requests (default 1 s)
 *   node scrape.mjs --output ./docs  # custom output directory
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";

// ── CLI flags ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const LIMIT = Number(flag("limit", "0")); // 0 = no limit
const DELAY_MS = Number(flag("delay", "1000"));
const OUTPUT_DIR = resolve(flag("output", "./output"));
const SITEMAP_URL = "https://www.notion.com/help/sitemap.xml";

// ── HTTP client ──────────────────────────────────────────────────────────────
const http = axios.create({
  timeout: 30_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Step 1 — Parse the sitemap ───────────────────────────────────────────────
async function fetchSitemapUrls() {
  console.log(`\n📡  Fetching sitemap: ${SITEMAP_URL}`);
  const { data } = await http.get(SITEMAP_URL);

  const parser = new XMLParser();
  const xml = parser.parse(data);

  // Sitemap can be <urlset><url><loc>…</loc></url></urlset>
  const entries = xml?.urlset?.url ?? [];
  const urls = (Array.isArray(entries) ? entries : [entries])
    .map((e) => e.loc)
    .filter(Boolean);

  console.log(`    Found ${urls.length} URLs in sitemap`);
  return urls;
}

// ── Step 2 — Extract article content from a single page ──────────────────────
function htmlToMarkdown($, el) {
  /**
   * Lightweight HTML → Markdown converter (no extra dependency).
   * Handles headings, paragraphs, lists, bold/italic, links, code, images.
   */
  let md = "";

  $(el)
    .contents()
    .each((_, node) => {
      const $n = $(node);

      if (node.type === "text") {
        md += node.data;
        return;
      }

      const tag = node.tagName?.toLowerCase();

      if (!tag) return;

      // Skip nav, footer, aside, script, style, svg, header elements
      if (
        ["nav", "footer", "aside", "script", "style", "svg", "noscript", "header", "button", "form"].includes(tag)
      ) {
        return;
      }

      // Headings
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1]);
        const text = $n.text().trim();
        if (text) md += `\n\n${"#".repeat(level)} ${text}\n`;
        return;
      }

      // Paragraphs
      if (tag === "p") {
        const inner = inlineToMd($, $n);
        if (inner.trim()) md += `\n\n${inner.trim()}`;
        return;
      }

      // Lists
      if (tag === "ul" || tag === "ol") {
        md += "\n";
        $n.children("li").each((i, li) => {
          const bullet = tag === "ol" ? `${i + 1}. ` : "- ";
          const text = inlineToMd($, $(li)).trim();
          if (text) md += `\n${bullet}${text}`;
        });
        md += "\n";
        return;
      }

      // Blockquote
      if (tag === "blockquote") {
        const text = $n.text().trim();
        if (text)
          md +=
            "\n\n" +
            text
              .split("\n")
              .map((l) => `> ${l}`)
              .join("\n");
        return;
      }

      // Pre / code block
      if (tag === "pre") {
        const code = $n.find("code").text() || $n.text();
        md += `\n\n\`\`\`\n${code.trim()}\n\`\`\`\n`;
        return;
      }

      // Images
      if (tag === "img") {
        const alt = $n.attr("alt") || "";
        const src = $n.attr("src") || "";
        if (src) md += `\n\n![${alt}](${src})\n`;
        return;
      }

      // Table
      if (tag === "table") {
        md += tableToMd($, $n);
        return;
      }

      // Divs and other containers — recurse
      md += htmlToMarkdown($, $n);
    });

  return md;
}

function inlineToMd($, $el) {
  let out = "";
  $el.contents().each((_, node) => {
    if (node.type === "text") {
      out += node.data;
      return;
    }
    const $n = $(node);
    const tag = node.tagName?.toLowerCase();

    if (tag === "strong" || tag === "b") {
      out += `**${$n.text()}**`;
    } else if (tag === "em" || tag === "i") {
      out += `*${$n.text()}*`;
    } else if (tag === "code") {
      out += `\`${$n.text()}\``;
    } else if (tag === "a") {
      const href = $n.attr("href") || "";
      const text = $n.text().trim();
      out += text ? `[${text}](${href})` : "";
    } else if (tag === "br") {
      out += "\n";
    } else if (tag === "img") {
      const alt = $n.attr("alt") || "";
      const src = $n.attr("src") || "";
      if (src) out += `![${alt}](${src})`;
    } else {
      out += $n.text();
    }
  });
  return out;
}

function tableToMd($, $table) {
  const rows = [];
  $table.find("tr").each((_, tr) => {
    const cells = [];
    $(tr)
      .find("th, td")
      .each((_, cell) => cells.push($(cell).text().trim()));
    rows.push(cells);
  });
  if (rows.length === 0) return "";

  const colCount = Math.max(...rows.map((r) => r.length));
  let md = "\n\n";
  rows.forEach((row, i) => {
    const padded = Array.from({ length: colCount }, (_, j) => row[j] || "");
    md += `| ${padded.join(" | ")} |\n`;
    if (i === 0) md += `| ${padded.map(() => "---").join(" | ")} |\n`;
  });
  return md;
}

// ── Step 3 — Scrape a single article ─────────────────────────────────────────
async function scrapeArticle(url) {
  const { data: html } = await http.get(url);
  const $ = cheerio.load(html);

  // Title: prefer <h1>, fall back to <title>
  const title =
    $("h1").first().text().trim() ||
    $("title").text().replace(/ – Notion.*$/, "").trim() ||
    "Untitled";

  // Try multiple selectors for the article body (Notion's help site may use
  // different class names, so we try several strategies)
  let $article =
    $("article").first().length ? $("article").first() :
    $('[class*="article"]').first().length ? $('[class*="article"]').first() :
    $("main").first().length ? $("main").first() :
    $('[role="main"]').first().length ? $('[role="main"]').first() :
    $("body");

  let markdown = `# ${title}\n\n`;
  markdown += `> Source: ${url}\n\n---\n`;
  markdown += htmlToMarkdown($, $article);

  // Clean up excessive whitespace
  markdown = markdown
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim();

  // If __NEXT_DATA__ has richer content, try to extract from there too
  const nextScript = $("#__NEXT_DATA__").html();
  if (nextScript && markdown.length < 200) {
    try {
      const nextData = JSON.parse(nextScript);
      const pageProps = nextData?.props?.pageProps;

      // Try common Contentful / CMS fields
      const body =
        pageProps?.article?.body ||
        pageProps?.content?.body ||
        pageProps?.page?.body ||
        null;

      if (body && typeof body === "string" && body.length > markdown.length) {
        markdown = `# ${title}\n\n> Source: ${url}\n\n---\n\n${body}`;
      }
    } catch {
      // JSON parse failed, keep what we have
    }
  }

  return { title, markdown, url };
}

// ── Step 4 — Main pipeline ───────────────────────────────────────────────────
async function main() {
  console.log("🚀  Notion Help Center Scraper");
  console.log(`    Output dir : ${OUTPUT_DIR}`);
  console.log(`    Delay      : ${DELAY_MS} ms`);
  if (LIMIT) console.log(`    Limit      : ${LIMIT} articles`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1 — Get all URLs from sitemap
  let urls = await fetchSitemapUrls();

  // Filter to only /help/ pages (exclude category pages, etc.)
  urls = urls.filter(
    (u) =>
      u.includes("/help/") &&
      !u.endsWith("/help") &&
      !u.endsWith("/help/")
  );
  console.log(`    ${urls.length} article URLs after filtering\n`);

  if (LIMIT) urls = urls.slice(0, LIMIT);

  // 2 — Scrape each article
  const results = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = url
      .replace(/^https?:\/\/[^/]+\/help\//, "")
      .replace(/\/$/, "")
      .replace(/\//g, "_");
    const filename = `${slug || "index"}.md`;

    try {
      process.stdout.write(
        `  [${i + 1}/${urls.length}] ${slug.substring(0, 50).padEnd(50)} `
      );

      const { markdown } = await scrapeArticle(url);
      writeFileSync(join(OUTPUT_DIR, filename), markdown, "utf-8");

      const sizeKB = (Buffer.byteLength(markdown) / 1024).toFixed(1);
      console.log(`✅  ${sizeKB} KB`);
      results.success++;
    } catch (err) {
      const code = err.response?.status || err.code || "UNKNOWN";
      console.log(`❌  ${code}`);
      results.failed++;
      results.errors.push({ url, error: code });
    }

    // Rate-limit
    if (i < urls.length - 1) await sleep(DELAY_MS);
  }

  // 3 — Summary
  console.log("\n" + "─".repeat(60));
  console.log(`✅  Scraped : ${results.success} articles`);
  console.log(`❌  Failed  : ${results.failed} articles`);
  console.log(`📁  Output  : ${OUTPUT_DIR}`);

  if (results.errors.length) {
    console.log("\nFailed URLs:");
    results.errors.forEach((e) => console.log(`   ${e.error}  ${e.url}`));
  }

  // 4 — Write an index file
  const indexMd = `# Notion Help Center — Scraped Index\n\n` +
    `Scraped on: ${new Date().toISOString()}\n` +
    `Articles: ${results.success}\n\n` +
    urls.map((u) => {
      const slug = u.replace(/^https?:\/\/[^/]+\/help\//, "").replace(/\/$/, "");
      return `- [${slug}](./${slug || "index"}.md)`;
    }).join("\n");

  writeFileSync(join(OUTPUT_DIR, "_INDEX.md"), indexMd, "utf-8");
  console.log(`📋  Index   : ${join(OUTPUT_DIR, "_INDEX.md")}\n`);
}

main().catch((err) => {
  console.error("\n💥  Fatal error:", err.message);
  process.exit(1);
});
