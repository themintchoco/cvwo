import { useCallback } from 'react'

import { FileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { Grid, Paper, Text, Title } from '@mantine/core'

import { Navbar, PostComposer } from '@/components'
import { meOpts } from '@/hooks/me'
import { userOpts } from '@/hooks/users'
import { postOpts, useUpdatePost } from '@/hooks/posts'
import { commentOpts, useUpdateComment } from '@/hooks/comments'
import { tagOpts } from '@/hooks/tags'
import { can } from '../auth'
import { ClientError } from '../error'

const Edit = () => {
  const navigate = useNavigate()

  const { source, sourceType, tags } = Route.useLoaderData()

  const updatePost = useUpdatePost()
  const updateComment = useUpdateComment()

  const handleEdit = useCallback((body: string) => {
    if (sourceType === 'post') {
      updatePost.mutate({ postId: source.id, body }, {
        onSuccess: (post) => {
          navigate({ to: '/post/$postId', params: { postId: post.id.toString() } })
        },
      })
    } else {
      updateComment.mutate({ commentId: source.id, body }, {
        onSuccess: (comment) => {
          navigate({ to: '/comment/$commentId', params: { commentId: comment.id.toString() } })
        },
      })
    }
  }, [sourceType, updatePost, source, navigate, updateComment])

  return source && (
    <div>
      <Navbar />
      <Grid p="sm" gutter="sm">
        <Grid.Col span={{ base: 12, xl: 11 }} offset={{ xl: 1 }}>
          <Title order={2} size="h3" my="xl">Edit {sourceType}</Title>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7, md: 8, xl: 7 }} offset={{ xl: 1 }}>
          <PostComposer
            defaultTitle={'title' in source ? source.title : undefined}
            defaultBody={source.body}
            defaultTags={tags.map((tag) => tag.name)}
            height="30dvh"
            onPost={({ body }) => handleEdit(body)}
            postLabel="Edit"
            loading={false}
            disableTitle
            hideTitle={sourceType === 'comment'}
            disableTagging
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 5, md: 4, xl: 3 }} >
          <Paper withBorder>
            <Text p="md">When you edit your {sourceType}, it will be marked with an edited indicator. </Text>
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  )
}

export const Route = new FileRoute('/edit').createRoute({
  component: Edit,
  validateSearch: (search: Record<string, string>) => {
    if (search.post) return { post: parseInt(search.post) }
    else if (search.comment) return { comment: parseInt(search.comment) }
    else return {}
  },
  loaderDeps: ({ search: { post, comment } }) => {
    return { post, comment }
  },
  beforeLoad: async ({ search, context: { queryClient } }) => {
    if (!search.post && !search.comment) throw new ClientError(400, 'Bad request')

    const source = search.post ? await queryClient.fetchQuery(postOpts(search.post)) : await queryClient.fetchQuery(commentOpts(search.comment))
    if (source.deleted) throw new ClientError(404, 'Not found')

    const me = await queryClient.ensureQueryData(meOpts())
    if (!me) throw redirect({ to: '/login', search: { redirect: '/' } })

    const user = await queryClient.ensureQueryData(userOpts(me.id))

    if (!can(user, source.author)) throw new ClientError(403, 'Forbidden')

    return { source }
  },
  loader: async ({ context: { queryClient, source } }) => {
    const sourceType = 'title' in source ? 'post' : 'comment'

    const tags = await Promise.all('tags' in source ? source.tags.map(async (tagId) =>
      queryClient.fetchQuery(tagOpts(tagId)),
    ) : [])

    return { source, sourceType, tags } as const
  },
})
