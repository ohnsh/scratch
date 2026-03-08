import type { Loader } from 'astro/loaders'

const dataDir = '../../.days/github'

export function githubDays(): Loader {
  return {
    name: 'github',
    load: async ({ store }) => {
      const { default: repos } = await import(`${dataDir}/repos.json`)
      const dayMap = {}
      for (const repo of repos) {
        const repoDayMap = await getRepoDays(repo)
        for (const day in repoDayMap) {
          const commits = repoDayMap[day]
          if (!dayMap[day]) {
            dayMap[day] = []
          }
          dayMap[day].push({ repo, commits })
        }
      }

      for (const day in dayMap) {
        store.set({
          id: day,
          data: dayMap[day],
        })
      }
    },
  }
}

async function getRepoDays(repo) {
  const { name } = repo
  const { default: commits } = await import(`${dataDir}/commits/${name}.json`)
  if (!Array.isArray(commits)) {
    return {}
  }
  return commits.reduce((map, commit) => {
    const { author: { name, email, date }} = commit.commit
    const [day] = date.split('T')
    if (!map[day]) {
      map[day] = []
    }
    map[day].push(commit)
    return map
  }, {})
}
