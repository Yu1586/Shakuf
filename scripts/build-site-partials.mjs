#!/usr/bin/env node
/**
 * Injects shared HTML partials into the static site pages, and regenerates
 * the sitemap's lastmod dates.
 *
 * The site has no other build step for its HTML — every page is otherwise a
 * complete, hand-written, independently servable file, and this script is
 * deliberately narrow rather than a general templating system. It solves one
 * problem: content that must say the exact same thing on more than one page
 * (the "law vs. what שקוף provides" table, the shared head assets, the header
 * and the Hebrew footer) had no way to stay in sync except a human remembering
 * to edit every copy.
 *
 * Each partial in site/_partials/*.html is injected, verbatim, between a
 * matching pair of `<!-- NAME:START -->` / `<!-- NAME:END -->` markers in
 * every target file that contains them. Markers are matched by NAME derived
 * from the partial's filename (compliance-table.html -> COMPLIANCE_TABLE).
 *
 * One partial gets a per-page touch: in HEADER, every link whose href is the
 * page's own URL receives aria-current="page". The partial never carries the
 * attribute itself, so the result is still a pure function of the partial and
 * the target path.
 *
 * Idempotent and in-place: running this twice with no partial changes produces
 * byte-identical output the second time, and every target file remains a
 * complete, valid page whether or not this has ever been run — the marker
 * pair always brackets real markup, checked into git, not a hole that only
 * gets filled at build time. That matters because Cloudflare Pages publishes
 * whatever `npm run build:site` leaves in site/, and this script runs as part
 * of it, but a page must not depend on that build step firing correctly to be
 * servable.
 *
 * A partial's own leading HTML comment (its documentation, if it has one) is
 * NOT copied into the target files — it would otherwise duplicate the same
 * long explanation into every page that includes it. Targets get a short
 * pointer back to the partial instead, generated here.
 *
 * The sitemap step reads each page's last commit date from git (or today's
 * date when the page has uncommitted changes), so lastmod stops being a value
 * someone has to remember to edit. It is skipped on Cloudflare Pages, whose
 * shallow clone would give every page the date of the latest commit; the
 * committed sitemap.xml is what gets deployed there.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_DIR = join(ROOT, 'site');
const PARTIALS_DIR = join(SITE_DIR, '_partials');
const ORIGIN = 'https://shakuf.yuvalrahamim.com';

// Every page. A page that lacks a given marker pair is simply skipped for that
// partial (/changelog/ is English and has no HEADER or FOOTER pair, for
// instance). The URL is what aria-current and the sitemap are keyed on; the
// 404 page has none because it is not a page of its own.
const TARGETS = [
  { file: 'site/index.html', url: '/' },
  { file: 'site/setup/index.html', url: '/setup/' },
  { file: 'site/disclaimer/index.html', url: '/disclaimer/' },
  { file: 'site/terms/index.html', url: '/terms/' },
  { file: 'site/changelog/index.html', url: '/changelog/' },
  { file: 'site/accessibility/index.html', url: '/accessibility/' },
  { file: 'site/en/index.html', url: '/en/' },
  { file: 'site/404.html', url: null },
];

function markerName(partialFilename) {
  return partialFilename.replace(/\.html$/, '').replace(/-/g, '_').toUpperCase();
}

/** Strips a single leading `<!-- ... -->` documentation block, if present. */
function stripLeadingComment(html) {
  const trimmed = html.replace(/^﻿/, '').trimStart();
  if (!trimmed.startsWith('<!--')) return html.trim();
  const end = trimmed.indexOf('-->');
  if (end === -1) return html.trim();
  return trimmed.slice(end + 3).trim();
}

/** Marks the links in a header block that point at the page itself. The brand
 *  is skipped: on the homepage the nav's own home link is the marked one. */
function markCurrent(block, url) {
  if (!url) return block;
  return block.replace(new RegExp(`<a\\b[^>]*\\bhref="${url}"`, 'g'), (a) =>
    a.includes('class="brand"') ? a : `${a} aria-current="page"`,
  );
}

/**
 * Assets every page links to, versioned by content hash. The pages reference
 * them as `/style.css?v=<hash>`, so a changed file is a new URL and the file
 * itself can be cached for a day (site/_headers). Without this a deploy that
 * changed both the HTML and the CSS left returning visitors with the new
 * markup on the hour-old stylesheet, which is how the demo pointer once
 * rendered as a giant unstyled arrow.
 */
const HASHED_ASSETS = ['/style.css', '/app.js'];

function assetHash(urlPath) {
  const bytes = readFileSync(join(SITE_DIR, urlPath));
  return createHash('sha1').update(bytes).digest('hex').slice(0, 8);
}

function versionAssets(html, hashes) {
  let out = html;
  for (const [urlPath, hash] of hashes) {
    const escaped = urlPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(href|src)="${escaped}(\\?v=[0-9a-f]+)?"`, 'g'), `$1="${urlPath}?v=${hash}"`);
  }
  return out;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function lastmod(file) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (git(['status', '--porcelain', '--', file])) return today;
    return git(['log', '-1', '--format=%cs', '--', file]) || today;
  } catch {
    return today;
  }
}

function writeSitemap() {
  if (process.env.CF_PAGES) {
    console.log('sitemap: skipped on Cloudflare Pages (shallow clone), serving the committed file.');
    return;
  }
  const rows = TARGETS.filter((t) => t.url).map(
    (t) => `  <url><loc>${ORIGIN}${t.url}</loc><lastmod>${lastmod(t.file)}</lastmod></url>`,
  );
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
  const path = join(SITE_DIR, 'sitemap.xml');
  let current = '';
  try { current = readFileSync(path, 'utf8'); } catch { /* first run */ }
  if (current !== xml) {
    writeFileSync(path, xml, 'utf8');
    console.log('sitemap: lastmod dates updated.');
  } else {
    console.log('sitemap: unchanged.');
  }
}

function main() {
  const partialFiles = readdirSync(PARTIALS_DIR).filter((f) => f.endsWith('.html'));
  if (partialFiles.length === 0) {
    console.error(`No partials found in ${PARTIALS_DIR}`);
    process.exit(1);
  }

  const partials = partialFiles.map((filename) => {
    const name = markerName(filename);
    const raw = readFileSync(join(PARTIALS_DIR, filename), 'utf8');
    const body = stripLeadingComment(raw);
    const source = `site/_partials/${filename}`;
    const block =
      `<!-- ${name}:START — generated from ${source}. Do not hand-edit; run ` +
      `\`npm run build:site\` after changing the source. -->\n` +
      `${body}\n` +
      `<!-- ${name}:END -->`;
    return { name, block, source };
  });

  let filesChanged = 0;
  let markersFilled = 0;
  const hashes = HASHED_ASSETS.map((p) => [p, assetHash(p)]);

  for (const { file, url } of TARGETS) {
    const targetPath = join(ROOT, file);
    const original = readFileSync(targetPath, 'utf8');
    let updated = original;

    for (const { name, block, source } of partials) {
      const re = new RegExp(`<!--\\s*${name}:START[\\s\\S]*?${name}:END\\s*-->`, 'm');
      if (!re.test(updated)) continue;
      const filled = name === 'HEADER' ? markCurrent(block, url) : block;
      updated = updated.replace(re, () => filled);
      markersFilled++;
      console.log(`  ${file}: filled ${name} from ${source}`);
    }
    updated = versionAssets(updated, hashes);

    if (updated !== original) {
      writeFileSync(targetPath, updated, 'utf8');
      filesChanged++;
    }
  }

  if (markersFilled === 0) {
    console.error(
      'No partial markers found in any target file. If a target legitimately ' +
        "doesn't use a given partial that's fine, but every partial should be " +
        'used SOMEWHERE: an unused partial is dead weight, and a marker that ' +
        'stopped matching (renamed, or a typo) fails silently otherwise.',
    );
    process.exit(1);
  }

  console.log(`site partials: ${markersFilled} marker(s) filled, ${filesChanged} file(s) changed.`);
  writeSitemap();
}

main();
