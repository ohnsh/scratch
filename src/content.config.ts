import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { githubDays } from '@/loaders/github'
import { youtubeDays } from '@/loaders/youtube'

const docs = defineCollection({ loader: docsLoader(), schema: docsSchema() })
const github = defineCollection({ loader: githubDays() })
const youtube = defineCollection({
  loader: youtubeDays(),
  schema: z.array(
    z.object({
      videoId: z.string(),
      title: z.string(),
      description: z.string(),
      thumbnails: z.object(),
      publishedAt: z.string(),
      isShort: z.boolean(),
    })
  ),
})
export const collections = { docs, github, youtube }
