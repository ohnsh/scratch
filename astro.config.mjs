// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  env: {
      schema: {
          YT_API_KEY: envField.string({ context: "server", access: "secret" }),
      }
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});