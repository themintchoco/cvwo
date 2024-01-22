import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useMe } from './me'
import { ClientError } from '../error'
import type { UserInfo } from '@/types/UserInfo'

export const useUser = (userId?: number) => {
  return useQuery(userOpts(userId))
}

export const useCurrentUser = () => {
  const { data: me } = useMe()
  return useUser(me?.id)
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { userId: number, update: { bio?: string, password?: string } }) => {
      const body = new URLSearchParams()

      if (vars.update.bio) body.set('bio', vars.update.bio)
      if (vars.update.password) body.set('password', vars.update.password)

      const res = await fetch(`/api/users/${vars.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<UserInfo>
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['users', { userId: user.id }], user)
    },
  })
}

export const useUpdateUserAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { userId: number, avatar: File }) => {
      const body = new FormData()
      body.append('file', vars.avatar)

      const res = await fetch(`/api/users/${vars.userId}/avatar`, {
        method: 'POST',
        body,
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<UserInfo>
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['users', { userId: user.id }], user)
    },
  })
}

export const useDeleteUserAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { userId: number }) => {
      const res = await fetch(`/api/users/${vars.userId}/avatar`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<UserInfo>
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['users', { userId: user.id }], user)
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<UserInfo>
    },
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users', { userId: user.id }] })
    },
  })
}

export const userOpts = (userId?: number) => queryOptions({
  queryKey: ['users', { userId }],
  queryFn: async () => {
    const res = await fetch(`/api/users/${userId}`)

    if (res.status === 404) {
      throw new ClientError(404, 'User not found')
    }

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<UserInfo>
  },
  enabled: !!userId,
})
