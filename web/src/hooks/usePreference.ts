import { useCallback, useEffect, useState } from 'react'

import { useMe, useUpdateMe } from './me'
import type { Me } from '@/types/Me'

type TUsePreference = {
  <TKey extends keyof Me['prefs']>(key: TKey): TUsePreferenceResult<TKey, undefined>
  <TKey extends keyof Me['prefs'], TVal extends Me['prefs'][TKey]>(key: TKey, defaultValue: TVal): TUsePreferenceResult<TKey, TVal>
}

type TUsePreferenceResult<TKey extends keyof Me['prefs'], TVal extends Me['prefs'][TKey] | undefined> = [Me['prefs'][TKey] | TVal, (value: Me['prefs'][TKey]) => void]

export const usePreference: TUsePreference = <TKey extends keyof Me['prefs'], TVal extends Me['prefs'][TKey]>(key: TKey, defaultValue?: TVal) : TUsePreferenceResult<TKey, TVal | undefined> => {
  const [cache, setCache] = useState<Me['prefs'][TKey] | null>(null)

  const { data: me } = useMe()
  const updateMe = useUpdateMe()

  const setValue = useCallback((value: Me['prefs'][TKey]) => {
    setCache(value)
    updateMe.mutate({ key, value: value.toString() })
  }, [key, updateMe])

  useEffect(() => {
    setCache(null)
  }, [me?.id])

  return [cache ?? me?.prefs?.[key] ?? defaultValue, setValue]
}
