import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "..\\public"
  ],
  // Vite's default lightningcss CSS minifier can't handle @keyframes nested
  // under Tailwind v4's cascade layers (talentsnaps-landing.css) — throws
  // "Unknown at rule: @keyframes" during `build-storybook` only (dev mode
  // skips minification). esbuild's minifier doesn't have this bug.
  async viteFinal(viteConfig) {
    viteConfig.build = { ...viteConfig.build, cssMinify: 'esbuild' };
    return viteConfig;
  },
};
export default config;