// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [react(), starlight({ title: '🧪 scratch' })]
});

/** @typedef {import('@astrojs/starlight/types').StarlightUserConfig} StarlightUserConfig */
/** @type {StarlightUserConfig} */
/* starlight({
	title: 'My Docs',
	social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
	sidebar: [
		{
			label: 'Guides',
			items: [
				// Each item here is one entry in the navigation menu.
				{ label: 'Example Guide', slug: 'guides/example' },
			],
		},
		{
			label: 'Reference',
			autogenerate: { directory: 'reference' },
		},
	],
}) */