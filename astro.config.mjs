import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { satteriKatex } from './plugins/satteri-katex.js';

import mdx from '@astrojs/mdx';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://niruvibes.github.io',
  base: '/zk-algos-comp3821',
  integrations: [mdx(), react()],
  markdown: {
    processor: satteri({
      features: { math: true },
      mdastPlugins: [satteriKatex]
    }),
  },
});