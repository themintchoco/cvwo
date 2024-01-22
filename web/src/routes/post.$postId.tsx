import { FileRoute, useNavigate } from '@tanstack/react-router'

import { Alert, Box, Grid, Group, Loader, Paper, Stack, Text } from '@mantine/core'
import { openContextModal } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { Trash, XCircle } from '@phosphor-icons/react'

import { Author, Comment, Navbar, PostComposer, PostMenu, ReactionButton, Sidebar, Tag, UserContent } from '@/components'
import { useCurrentUser } from '@/hooks/users'
import { usePostReactions, useUpdatePostReaction, useUserPostReaction } from '@/hooks/reactions'
import { useComments, useCreateComment } from '@/hooks/comments'
import { postOpts, useDeletePost } from '@/hooks/posts'
import { useVirtualized } from '@/hooks/virtualized'
import { can } from '../auth'

const Post = () => {
  const navigate = useNavigate()

  const post = Route.useLoaderData()

  const { data: user } = useCurrentUser()
  const { data: userReaction } = useUserPostReaction(post.id, user?.id)
  const { data: postReactions } = usePostReactions(post.id)

  const updatePostReaction = useUpdatePostReaction()
  const deletePost = useDeletePost()

  const commentsData = useComments({ filter: { postId: post.id } })
  const { props, data: comments, isLoading, isError } = useVirtualized(commentsData)

  const createComment = useCreateComment()

  const handleReact = (reaction: string) => {
    if (!user) return openContextModal({
      modal: 'signUp',
      centered: true,
      innerProps: { action: 'react' },
    })

    if (userReaction?.name === reaction) updatePostReaction.mutate({ postId: post.id, reaction: null })
    else updatePostReaction.mutate({ postId: post.id, reaction })
  }

  const handleComment = (body: string) => {
    if (!user) return openContextModal({
      modal: 'signUp',
      centered: true,
      innerProps: { action: 'comment' },
    })

    createComment.mutate({ postId: post.id, body }, {
      onSuccess: (comment) => {
        navigate({ to: '/comment/$commentId', params: { commentId: comment.id.toString() } })
      },
    })
  }

  const handleEdit = () => {
    navigate({ to: '/edit', search: { post: post.id } })
  }

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        navigate({ to: '/' })

        notifications.show({
          autoClose: 5000,
          title: 'Post deleted',
          message: 'The post has been deleted successfully',
          color: 'red',
        })
      },
    })
  }

  return (
    <div>
      <Navbar />
      <Grid p="sm" gutter="sm">
        <Grid.Col span={{ base: 12, sm: 5, md: 4, xl: 3 }} offset={{ xl: 1 }} order={{ base: 2, sm: 1 }}>
          <Sidebar />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7, md: 8, xl: 7 }} order={{ base: 1, sm: 2 }}>
          <Stack>
            <Paper shadow="md" radius="md" p="xl">
              <Stack>
                <Group justify="space-between">
                  <Author source={post} />
                  <PostMenu
                    source={post}
                    showPrivilegedActions={can(user, post.author)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </Group>

                {
                  !post.deleted ? (
                    <>
                      <Text size="xl" fw={600}>{ post.title }</Text>
                      <UserContent content={post.body} />

                      {
                        post.tags.length > 0 && (
                          <Group>
                            {
                              post.tags.map((tagId) => (
                                <Tag key={tagId} tagId={tagId} compact />
                              ))
                            }
                          </Group>
                        )
                      }
                    </>
                  ) : (
                    <Alert variant="outline" color="red" title="Deleted post" icon={<Trash size={32} />}>
                      This post has been deleted.
                    </Alert>
                  )
                }

                <Group>
                  {
                    postReactions?.map((reaction) => (
                      <ReactionButton
                        key={reaction.id}
                        reactions={[reaction]}
                        value={reaction.id === userReaction?.id ? reaction.id : undefined}
                        onSelect={() => handleReact(reaction.name)} />
                    ))
                  }

                  {
                    !userReaction && (
                      <ReactionButton reactions={[]} onSelect={(reaction) => reaction && handleReact(reaction)} withPicker />
                    )
                  }
                </Group>
              </Stack>
            </Paper>

            <Text c="dimmed" px="xl" py="sm">Comments</Text>

            <Paper shadow="md" radius="md" p="xl">
              <Text fw={600} mb="xs">Join the discussion</Text>

              <PostComposer height="10dvh" onPost={({ body }) => handleComment(body)} postLabel="Comment" hideTitle hideTagging />

              <Box mt="xl" {...props}>
                {
                  comments?.map(({ data, props }) => (
                    <Box {...props}>
                      <Comment post={post} comment={data} py="md" />
                    </Box>
                  ))
                }
              </Box>
            </Paper>

            {
              isLoading && (
                <Group justify="center">
                  <Loader size="lg" />
                </Group>
              )
            }

            {
              isError && (
                <Stack align="center">
                  <XCircle size={96} weight="light" color="red"/>
                  <Text size="lg" fw={600}>An error has occurred</Text>
                  <Text>Please try again later.</Text>
                </Stack>
              )
            }
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  )
}

export const Route = new FileRoute('/post/$postId').createRoute({
  component: Post,
  loader: ({ context: { queryClient }, params: { postId } }) =>
    queryClient.ensureQueryData(postOpts(parseInt(postId))),
})
