import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';

const { publicVars } = loadEnv({ prefixes: ['VITE_'] });

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './index.html',
  },
  source: {
    define: publicVars,
  },
  tools: {
    rspack: {
      plugins: [TanStackRouterRspack({ target: 'react' })],
    },
  },
});
