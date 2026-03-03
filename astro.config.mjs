// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import fs from 'node:fs'

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
        server: {
            allowedHosts: ['localhost', 'mini.local'],
            https: {
                key: fs.readFileSync('./.cert/mini.local-key.pem'),
                cert: fs.readFileSync('./.cert/mini.local.pem'),
            },
        },
    },
    integrations: [
        react(),
        starlight({
            title: '🧪 scratch',
            sidebar: [
				{ slug: 'ptz-demo', badge: 'new' },
				'webrtc-demo',
				'mux-test',
				'ttyd-demo',
				'youtube-rss',
				'youtube-data-api',
				{ label: 'Log', items: [
					{ label: 'March', autogenerate: { directory: '2026/mar' } },
					{ label: 'February', autogenerate: { directory: '2026/feb' }, collapsed: true },
				]}
			],
        }),
    ],
    markdown: { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] },
})

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
