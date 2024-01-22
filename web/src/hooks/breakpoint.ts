import { useMantineTheme, type MantineBreakpoint } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'

interface UseBreakpointOptions {
  min?: MantineBreakpoint
  max?: MantineBreakpoint
}

export const useBreakpoint = ({ min, max } : UseBreakpointOptions) => {
  const theme = useMantineTheme()

  const minQuery = min && `(min-width: ${theme.breakpoints[min]})`
  const maxQuery = max && `(max-width: ${theme.breakpoints[max]})`

  return useMediaQuery([minQuery, maxQuery].filter(Boolean).join(' and '))
}
