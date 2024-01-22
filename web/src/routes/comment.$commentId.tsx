import { FileRoute, Link, useNavigate } from '@tanstack/react-router'

import { Alert, Button, Grid, Group, Paper, Stack, Text } from '@mantine/core'
import { openContextModal } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { ArrowRight, Trash } from '@phosphor-icons/react'

import { Author, Navbar, PostMenu, Sidebar, UserContent, VoteButton } from '@/components'
import { useCurrentUser } from '@/hooks/users'
import { commentOpts, useDeleteComment } from '@/hooks/comments'
import { useCommentReactions, useUpdateCommentReaction, useUserCommentReaction } from '@/hooks/reactions'
import { can } from '../auth'

const Comment = () => {
  const navigate = useNavigate()

  const comment = Route.useLoaderData()

  const { data: user } = useCurrentUser()
  const { data: userReaction } = useUserCommentReaction(comment.id, user?.id)
  const { data: commentReactions } = useCommentReactions(comment.id)

  const updateCommentReaction = useUpdateCommentReaction()
  const deleteComment = useDeleteComment()

  const vote = (commentReactions?.find((reaction) => reaction.name === 'Upvote')?.count ?? 0) - (commentReactions?.find((reaction) => reaction.name === 'Downvote')?.count ?? 0)

  const handleReact = (reaction: string) => {
    if (!user) return openContextModal({
      modal: 'signUp',
      centered: true,
      innerProps: { action: 'vote' },
    })

    if (reaction === userReaction?.name) updateCommentReaction.mutate({ commentId: comment.id, reaction: null })
    else updateCommentReaction.mutate({ commentId: comment.id, reaction })
  }

  const handleEdit = () => {
    navigate({ to: '/edit', search: { comment: comment.id } })
  }

  const handleDelete = () => {
    deleteComment.mutate(comment.id, {
      onSuccess: () => {
        navigate({ to: '/post/$postId', params: { postId: comment.postId.toString() } })

        notifications.show({
          autoClose: 5000,
          title: 'Comment deleted',
          message: 'The comment has been deleted successfully',
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
              <Group justify="space-between">
                <Text>You&apos;re viewing a single comment</Text>
                <Button
                  variant="outline"
                  radius="md"
                  rightSection={<ArrowRight size={24} />}
                  component={Link}
                  to="/post/$postId"
                  params={{ postId: comment.postId.toString() }}>
                  View post
                </Button>
              </Group>
            </Paper>
            <Paper shadow="md" radius="md" p="xl">
              <Stack>
                <Group justify="space-between">
                  <Author source={comment} />
                  <PostMenu
                    source={comment}
                    showPrivilegedActions={can(user, comment.author)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </Group>

                {
                  !comment.deleted ? (
                    <UserContent content={comment.body} />
                  ) : (
                    <Alert variant="outline" color="red" title="Deleted comment" icon={<Trash size={32} />}>
                      This comment has been deleted.
                    </Alert>
                  )
                }

                <VoteButton value={userReaction ?? undefined} count={vote} onSelect={handleReact} />
              </Stack>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  )
}

export const Route = new FileRoute('/comment/$commentId').createRoute({
  component: Comment,
  loader: ({ context: { queryClient }, params: { commentId } }) =>
    queryClient.ensureQueryData(commentOpts(parseInt(commentId))),
})
