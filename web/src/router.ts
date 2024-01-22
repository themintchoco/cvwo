import { NotFoundRoute, Router } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'

import { routeTree } from './routeTree.gen'
import { ErrorFallback } from '@/components'
import { ClientError } from './error'

export const queryClient = new QueryClient()

export const router = new Router({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: ErrorFallback,
  notFoundRoute: new NotFoundRoute({
    getParentRoute: () => routeTree,
    component: () => ErrorFallback({ error: new ClientError(404, 'Page not found') }),
  }),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
