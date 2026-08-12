import { defineConfig } from 'tsup';

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
  },
]);
