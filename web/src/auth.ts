import { queryClient, router } from './router'
import type { UserInfo } from './types/UserInfo'

type AuthCredentials = {
  username: string
  password: string
}

export const login = async (creds: AuthCredentials) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(creds),
  })

  if (res.status === 401) {
    queryClient.setQueryData(['me'], null)
    return false
  }

  if (!res.ok) {
    throw new Error()
  }

  queryClient.setQueryData(['me'], await res.json())
  return true
}

export const register = async (creds: AuthCredentials) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(creds),
  })

  if (!res.ok) {
    throw new Error()
  }

  queryClient.setQueryData(['me'], await res.json())
  return true
}

export const logout = async () => {
  const res = await fetch('/api/auth/logout', {
    method: 'POST',
  })

  if (!res.ok) {
    throw new Error()
  }

  router.navigate({ to: '/' })
  queryClient.setQueryData(['me'], null)
  return true
}

export const can = (user?: UserInfo, target?: UserInfo) => {
  return user && (user.role === 'admin' || target && !target.deleted && user.id === target.id)
}
