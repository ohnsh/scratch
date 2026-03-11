// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import react from '@astrojs/react'
import starlight from '@astrojs/starlight'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import flexoki from 'starlight-theme-flexoki'
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
      plugins: [flexoki({ accentColor: 'blue' })],
      title: 'scratch',
      lastUpdated: true,
      logo: {
        replacesTitle: true,
        dark: '@/assets/flask-conical-dark.svg',
        light: '@/assets/flask-conical-light.svg',
      },
      customCss: ['@/styles/global-sl.css'],
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'icon', href: '/flask-conical.png', type: 'image/png' } },
      ],
      // favicon value always rendered after custom tags, so it needs to be the preferred icon.
      favicon: '/flask-conical.svg',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ohnsh/scratch' },
        { icon: 'youtube', label: 'YouTube', href: 'https://youtube.com/@ohn-sh' },
        { icon: 'instagram', label: 'Instagram', href: 'https://instagram.com/j.ohn.sh' },
      ],
      sidebar: [
        {
          label: 'John Sherrell',
          link: 'https://j.ohn.sh',
          attrs: { target: '_blank', class: 'author' },
        },
        { slug: 'ptz-demo', badge: 'new' },
        'ttyd-demo',
        'yolo-demo',
        'github-days',
        'youtube-data-api',
        {
          label: 'scratch',
          collapsed: true,
          items: ['webrtc-demo', 'youtube-rss'],
        },
        {
          label: 'days.ohn.sh',
          link: 'https://days.ohn.sh',
          attrs: { target: '_blank', style: 'margin-top: 2em' },
        },
        {
          label: 'j.ohn.sh',
          link: 'https://j.ohn.sh',
          attrs: { target: '_blank' },
        },
      ],
    }),
  ],
  markdown: { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] },
})

/** @typedef {import('@astrojs/starlight/types').StarlightUserConfig} StarlightUserConfig */
/** @type {StarlightUserConfig} */
