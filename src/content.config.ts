import { defineCollection, z } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'
import { githubDays } from '@/loaders/github'

const docs = defineCollection({ loader: docsLoader(), schema: docsSchema() })
const github = defineCollection({ loader: githubDays() })
export const collections = { docs, github }
