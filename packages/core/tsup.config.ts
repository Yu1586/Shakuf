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
 * inline SVG data URIs. It is scoped to this one file for that reason — do not
 * widen the filter without re-checking both.
 */
const stripCssComments = {
  name: 'strip-css-comments',
  setup(build: {
    onLoad(
      options: { filter: RegExp },
      callback: (args: { path: string }) => Promise<{ contents: string; loader: 'ts' }>,
    ): void;
  }) {
    build.onLoad({ filter: /host-styles\.ts$/ }, async (args) => ({
      contents: (await readFile(args.path, 'utf8')).replace(/\/\*[\s\S]*?\*\//g, ''),
      loader: 'ts' as const,
    }));
  },
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
  },
]);
