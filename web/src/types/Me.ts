export type Me = {
  id: number
  prefs: {
    prefersDarkMode: boolean
    prefersReducedMotion: boolean
    preferredSort: 'latest' | 'popular' | 'replies'
  }
}
