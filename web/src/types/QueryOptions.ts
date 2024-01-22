export type PostsQueryOptions = {
  filter?: {
    author?: string
    tag?: string
    query?: string
  }

  sort?: 'latest' | 'popular' | 'replies'
}

export type CommentsQueryOptions = {
  filter?: {
    postId?: number
    author?: string
  }

  sort?: 'latest' | 'top'
}

export type TagsQueryOptions = {
  filter?: {
    query?: string
  }
}
