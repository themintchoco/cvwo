import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { TagInfo } from '@/types/TagInfo'
import type { TagsQueryOptions } from '@/types/QueryOptions'

export const useTags = (options?: TagsQueryOptions) => {
  return useQuery(tagsOpts(options))
}

export const useTag = (tagId?: number) => {
  return useQuery(tagOpts(tagId))
}

export const useTrendingTags = () => {
  return useQuery(trendingTagsOpts())
}

export const useUpdateTag = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vars: { tagId: number, color: string, description: string }) => {
      const res = await fetch(`/api/tags/${vars.tagId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ color: vars.color, description: vars.description }),
      })

      if (!res.ok) {
        throw new Error()
      }

      return res.json() as Promise<TagInfo>
    },
    onSuccess: (tag) => {
      queryClient.setQueryData(['tags', { tagId: tag.id }], tag)
    },
  })
}

export const tagsOpts = ({ filter: { query } = {} } : TagsQueryOptions = {}) => queryOptions({
  queryKey: ['tags', { query }],
  queryFn: async () => {
    const search = new URLSearchParams()
    if (query) search.set('query', query)

    const res = await fetch(`/api/tags?${search}`)

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<TagInfo[]>
  },
})

export const tagOpts = (tagId?: number) => queryOptions({
  queryKey: ['tags', { tagId }],
  queryFn: async () => {
    const res = await fetch(`/api/tags/${tagId}`)

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<TagInfo>
  },
  enabled: !!tagId,
})

export const trendingTagsOpts = () => queryOptions({
  queryKey: ['tags', 'trending'],
  queryFn: async () => {
    const res = await fetch('/api/tags/trending')

    if (!res.ok) {
      throw new Error()
    }

    return res.json() as Promise<TagInfo[]>
  },
})
