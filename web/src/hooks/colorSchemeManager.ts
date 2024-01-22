import { useEffect, useMemo, useRef } from 'react'

import type { MantineColorScheme, MantineColorSchemeManager } from '@mantine/core'

import { usePreference } from './usePreference'

export const useColorSchemeManager = () : MantineColorSchemeManager => {
  const callbackRef = useRef<((colorScheme: MantineColorScheme) => void) | null>(null)

  const [prefersDarkMode, setPrefersDarkMode] = usePreference('prefersDarkMode')

  useEffect(() => {
    if (typeof prefersDarkMode === 'undefined') return

    callbackRef.current?.(prefersDarkMode ? 'dark' : 'light')
  }, [prefersDarkMode])

  return useMemo(() => ({
    get() {
      return prefersDarkMode ? 'dark' : 'light'
    },

    set(value) {
      setPrefersDarkMode(value === 'dark')
    },

    subscribe(onUpdate) {
      callbackRef.current = onUpdate
    },

    unsubscribe() {
      callbackRef.current = null
    },

    clear() {},
  }), [prefersDarkMode, setPrefersDarkMode])
}
