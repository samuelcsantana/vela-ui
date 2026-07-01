import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { TanStackRouterRspack } from '@tanstack/router-plugin/rspack';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './index.html',
  },
  tools: {
    rspack: {
      plugins: [TanStackRouterRspack({ target: 'react' })],
    },
  },
});
