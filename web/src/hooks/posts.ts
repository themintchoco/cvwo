import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ClientError } from '../error'
import type { FullPostInfo, PostInfo } from '@/types/PostInfo'
import type { PostsQueryOptions } from '@/types/QueryOptions'

export const usePosts = (options?: PostsQueryOptions) => {
  return useInfiniteQuery(postsOpts(options))
}

export const usePost = (postId?: number) => {
  return useQuery(postOpts(postId))
}

export const useCreatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { title: string, body: string, tags: string }) => {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(vars),
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<FullPostInfo>
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.setQueryData(['posts', { postId: post.id }], post)
    },
  })
}

export const useUpdatePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { postId: number, body: string }) => {
      const res = await fetch(`/api/posts/${vars.postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ body: vars.body }),
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<FullPostInfo>
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.setQueryData(['posts', { postId: post.id }], post)
    },
  })
}

export const useDeletePost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export const postsOpts = ({ filter: { author, tag, query } = {}, sort = 'latest' } : PostsQueryOptions = {}) => infiniteQueryOptions({
  queryKey: ['posts', { author, tag, sort, query }],
  initialPageParam: 1,
  getNextPageParam: (lastPage, _, lastPageParam) =>
    lastPage.length === 0 ? undefined : lastPageParam + 1,
  queryFn: async ({ pageParam } : { pageParam: number }) => {
    const search = new URLSearchParams({ page: pageParam.toString(), sort })

    if (author) search.set('user', author)
    if (tag) search.set('tag', tag)
    if (query) search.set('query', query)

    const res = await fetch(`/api/posts?${search}`)

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<FullPostInfo[]>
  },
})

export const postOpts = (postId?: number) => queryOptions({
  queryKey: ['posts', { postId }],
  queryFn: async () => {
    const res = await fetch(`/api/posts/${postId}`)

    if (res.status === 404) {
      throw new ClientError(404, 'Post not found')
    }

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<PostInfo>
  },
  enabled: !!postId,
})
