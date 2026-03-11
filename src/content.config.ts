import { defineCollection, z } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { githubDays } from '@/loaders/github'
import { youtubeDays } from '@/loaders/youtube'

const docs = defineCollection({ loader: docsLoader(), schema: docsSchema() })
const github = defineCollection({ loader: githubDays() })
const youtube = defineCollection({ loader: youtubeDays() })
export const collections = { docs, github, youtube }
