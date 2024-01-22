import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Me } from '@/types/Me'

export const useMe = () => {
  return useQuery(meOpts())
}

export const useUpdateMe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { key: keyof Me['prefs'], value: string }) => {
      const res = await fetch(`/api/me/${vars.key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ value: vars.value }),
      })

      if (!res.ok) {
        throw new Error()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export const meOpts = () => queryOptions({
  queryKey: ['me'],
  queryFn: async () => {
    const res = await fetch('/api/me')

    if (res.status === 401) {
      return null
    }

    return res.json() as Promise<Me>
  },
})
