import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ReactionInfo } from '@/types/ReactionInfo'

export const usePostReactions = (postId?: number) => {
  return useQuery(postReactionsOpts(postId))
}

export const useUserPostReaction = (postId?: number, userId?: number) => {
  return useQuery(userPostReactionsOpts(postId, userId))
}

export const useCommentReactions = (commentId?: number) => {
  return useQuery(commentReactionsOpts(commentId))
}

export const useUserCommentReaction = (commentId?: number, userId?: number) => {
  return useQuery(userCommentReactionOpts(commentId, userId))
}

export const useUpdatePostReaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { postId: number, reaction: string | null }) => {
      const res = await fetch(`/api/reactions/post/${vars.postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ reaction: vars.reaction ?? '' }),
      })

      if (!res.ok) {
        throw new Error()
      }

      return
    },

    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', 'post', postId] })
    },
  })
}

export const useUpdateCommentReaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { commentId: number, reaction: string | null }) => {
      const res = await fetch(`/api/reactions/comment/${vars.commentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ reaction: vars.reaction ?? '' }),
      })

      if (!res.ok) {
        throw new Error()
      }

      return
    },

    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', 'comment', commentId] })
    },
  })
}

export const postReactionsOpts = (postId?: number) => queryOptions({
  queryKey: ['reactions', 'post', postId],
  queryFn: async () => {
    const res = await fetch(`/api/reactions/post/${postId}`)

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<ReactionInfo[]>
  },
  enabled: !!postId,
})

export const userPostReactionsOpts = (postId?: number, userId?: number) => queryOptions({
  queryKey: ['reactions', 'post', postId, userId],
  queryFn: async () => {
    const res = await fetch(`/api/reactions/post/${postId}/${userId}`)

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<ReactionInfo>
  },
  enabled: !!postId && !!userId,
})

export const commentReactionsOpts = (commentId?: number) => queryOptions({
  queryKey: ['reactions', 'comment', commentId],
  queryFn: async () => {
    const res = await fetch(`/api/reactions/comment/${commentId}`)

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<ReactionInfo[]>
  },
  enabled: !!commentId,
})

export const userCommentReactionOpts = (commentId?: number, userId?: number) => queryOptions({
  queryKey: ['reactions', 'comment', commentId, userId],
  queryFn: async () => {
    const res = await fetch(`/api/reactions/comment/${commentId}/${userId}`)

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<ReactionInfo>
  },
  enabled: !!commentId && !!userId,
})
