import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ClientError } from '../error'
import type { CommentInfo, FullCommentInfo } from '@/types/CommentInfo'
import type { CommentsQueryOptions } from '@/types/QueryOptions'

export const useComments = (options?: CommentsQueryOptions) => {
  return useInfiniteQuery(commentsOpts(options))
}

export const useComment = (commentId?: number) => {
  return useQuery(commentOpts(commentId))
}

export const useCreateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { postId: number, body: string }) => {
      const res = await fetch(`/api/comments?post=${vars.postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ body: vars.body }),
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<FullCommentInfo>
    },
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: ['comments', { postId: comment.postId }] })
      queryClient.invalidateQueries({ queryKey: ['comments', { author: comment.author.username }] })
      queryClient.setQueryData(['comments', { commentId: comment.id }], comment)
    },
  })
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { commentId: number, body: string }) => {
      const res = await fetch(`/api/comments/${vars.commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ body: vars.body }),
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<FullCommentInfo>
    },
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: ['comments', { postId: comment.postId }] }),
      queryClient.invalidateQueries({ queryKey: ['comments', { author: comment.author.username }] }),
      queryClient.setQueryData(['comments', { commentId: comment.id }], comment)
    },
  })
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: number) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<FullCommentInfo>
    },
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: ['comments', { postId: comment.postId }] })
      queryClient.invalidateQueries({ queryKey: ['comments', { author: comment.author.username }] })
      queryClient.invalidateQueries({ queryKey: ['comments', { commentId: comment.id }] })
    },
  })
}

export const commentsOpts = ({ filter: { postId, author } = {}, sort = 'latest' } : CommentsQueryOptions = {}) => infiniteQueryOptions({
  queryKey: ['comments', { postId, author, sort }],
  initialPageParam: 1,
  getNextPageParam: (lastPage, _, lastPageParam) =>
    lastPage.length === 0 ? undefined : lastPageParam + 1,
  queryFn: async ({ pageParam } : { pageParam: number }) => {
    const search = new URLSearchParams({ page: pageParam.toString(), sort })

    if (postId) search.set('post', postId.toString())
    if (author) search.set('user', author)

    const res = await fetch(`/api/comments?${search}`)

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<FullCommentInfo[]>
  },
  enabled: !!postId || !!author,
})

export const commentOpts = (commentId?: number) => queryOptions({
  queryKey: ['comments', { commentId }],
  queryFn: async () => {
    const res = await fetch(`/api/comments/${commentId}`)

    if (res.status === 404) {
      throw new ClientError(404, 'Comment not found')
    }

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<CommentInfo>
  },
  enabled: !!commentId,
})
