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
      title: 'scratch',
      lastUpdated: true,
      logo: {
        replacesTitle: true,
        dark: '@/assets/flask-conical-dark.svg',
        light: '@/assets/flask-conical-light.svg',
      },
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'icon', href: '/flask-conical.png', type: 'image/png' } },
      ],
      // favicon value always rendered after custom tags, so it needs to be the preferred icon.
      favicon: '/flask-conical.svg',
      sidebar: [
        {
          label: 'scratch',
          items: [
            { slug: 'ptz-demo', badge: 'new' },
            'webrtc-demo',
            'yolo-demo',
            'mux-test',
            'ttyd-demo',
            'youtube-data-api',
            'youtube-rss',
          ],
        },
        { label: 'days.ohn.sh', link: 'https://days.ohn.sh', attrs: { target: '_blank' } },
        { label: 'j.ohn.sh', link: 'https://j.ohn.sh', attrs: { target: '_blank' } },
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
