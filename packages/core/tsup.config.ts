import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';

/**
 * Strips the CSS comments out of `host-styles.ts` before esbuild sees it.
 *
 * Those comments sit inside a template literal, which makes them string content
 * rather than code: `minify` removes every JS comment in the bundle but cannot
 * touch these, so they were being delivered to every visitor of every site
 * running the widget. Measured on the injected stylesheet before this existed:
 * 3,975 of 8,963 bytes — 44% of it — was comment text.
 *
 * The comments themselves are worth keeping in the source. That file encodes
 * legal positions as CSS rules and the rationale is why nobody "tidies" a rule
 * back into a bug later. This removes them from the payload, not from the repo.
 *
 * Safe on this file specifically, and both conditions were checked rather than
 * assumed: every comment sits on its own line between rules, so removing one
 * cannot weld two tokens together, and no comment marker appears inside the
 * inline SVG data URIs. It is scoped to named files for that reason — do not
 * widen the filter without re-checking both.
 *
 * Widened to `ui/styles.ts` on 2026-10-10, after the same two checks were run
 * on it by script: all 29 comments sit between whitespace on both sides, and
 * the file contains no `url(` at all. Its comments had been shipping too, and
 * the 0.4.0 accessibility fixes pushed the bundle to 98% of budget without this.
 */
const stripCssComments = {
  name: 'strip-css-comments',
  setup(build: {
    onLoad(
      options: { filter: RegExp },
      callback: (args: { path: string }) => Promise<{ contents: string; loader: 'ts' }>,
    ): void;
  }) {
    build.onLoad({ filter: /(host-styles|[\\/]ui[\\/]styles)\.ts$/ }, async (args) => ({
      contents: (await readFile(args.path, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, ''),
      loader: 'ts' as const,
    }));
  },
};

/**
 * Licence and disclaimer banner, kept by the minifier because it opens with /*!.
 *
 * Self-hosters are told to download dist/shakuf.js and serve it themselves, so
 * that file is the most-copied artefact this project produces. Without a banner
 * it travelled with no licence notice, no version and none of the disclaimer.
 * The disclaimer sentence matches NOTICE; the version is read from package.json
 * so it can never drift.
 */
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};
const BANNER = {
  js:
    `/*! Shakuf v${version} | Apache-2.0 | (c) 2026 Yuval Rahamim | https://shakuf.yuvalrahamim.com\n` +
    ' * Adjusts display only. Does not ensure conformance with SI 5568 and does not replace making a site accessible. */',
};

export default defineConfig([
  // Script-tag build. This is the ~90% install path (WordPress, Wix, plain HTML).
  // Self-executing, no globals leaked beyond a single namespaced key.
  {
    entry: { shakuf: 'src/auto.ts' },
    format: ['iife'],
    globalName: '__A11yIL__',
    target: 'es2019',
    minify: true,
    sourcemap: true,
    clean: true,
    dts: false,
    outExtension: () => ({ js: '.js' }),
    esbuildPlugins: [stripCssComments],
    banner: BANNER,
  },
  // npm build, for bundlers (React/Vue wrappers in phase 2).
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'es2019',
    minify: false,
    sourcemap: true,
    clean: false,
    dts: true,
    esbuildPlugins: [stripCssComments],
    banner: BANNER,
  },
]);
