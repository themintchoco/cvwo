import { Outlet, rootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'

import { useColorSchemeManager } from '@/hooks/colorSchemeManager'
import { theme } from '../theme'
import { modals } from '../modals'

const Root = () => {
  const colorSchemeManager = useColorSchemeManager()

  return (
    <MantineProvider theme={theme} colorSchemeManager={colorSchemeManager}>
      <Notifications />
      <ModalsProvider modals={modals}>
        <Outlet />
      </ModalsProvider>
    </MantineProvider>
  )
}

interface Context {
  queryClient: QueryClient
}

export const Route = rootRouteWithContext<Context>()({
  component: Root,
})
