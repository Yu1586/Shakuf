#!/usr/bin/env node
/**
 * Injects shared HTML partials into the static site pages.
 *
 * The site has no other build step for its HTML — every page is otherwise a
 * complete, hand-written, independently servable file, and this script is
 * deliberately narrow rather than a general templating system. It solves one
 * problem: content that must say the exact same thing on more than one page
 * (right now, only the "law vs. what שקוף provides" table) had no way to stay
 * in sync except a human remembering to edit both.
 *
 * Each partial in site/_partials/*.html is injected, verbatim, between a
 * matching pair of `<!-- NAME:START -->` / `<!-- NAME:END -->` markers in
 * every target file that contains them. Markers are matched by NAME derived
 * from the partial's filename (compliance-table.html -> COMPLIANCE_TABLE).
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
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_DIR = join(ROOT, 'site');
const PARTIALS_DIR = join(SITE_DIR, '_partials');

const TARGET_FILES = ['site/index.html', 'site/disclaimer/index.html'].map((p) => join(ROOT, p));

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

  for (const targetPath of TARGET_FILES) {
    const original = readFileSync(targetPath, 'utf8');
    let updated = original;
    const relTarget = targetPath.slice(ROOT.length + 1).replace(/\\/g, '/');

    for (const { name, block, source } of partials) {
      const re = new RegExp(`<!--\\s*${name}:START[\\s\\S]*?${name}:END\\s*-->`, 'm');
      if (!re.test(updated)) continue;
      updated = updated.replace(re, block);
      markersFilled++;
      console.log(`  ${relTarget}: filled ${name} from ${source}`);
    }

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
}

main();
