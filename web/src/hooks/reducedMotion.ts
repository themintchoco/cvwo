import { useReducedMotion as mantineUseReducedMotion } from '@mantine/hooks'

import { usePreference } from './usePreference'

export const useReducedMotion = () => {
  const [prefersReducedMotion] = usePreference('prefersReducedMotion')
  const reducedMotion = mantineUseReducedMotion()

  return prefersReducedMotion || reducedMotion
}
