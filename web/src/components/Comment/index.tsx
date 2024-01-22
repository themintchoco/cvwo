import { Link, useNavigate } from '@tanstack/react-router'

import { Badge, Box, Group, Overlay, Stack, type StackProps } from '@mantine/core'
import { openContextModal } from '@mantine/modals'
import { notifications } from '@mantine/notifications'

import { Author, PostMenu, UserContent, VoteButton } from '@/components'
import { useCurrentUser } from '@/hooks/users'
import { useCommentReactions, useUpdateCommentReaction, useUserCommentReaction } from '@/hooks/reactions'
import type { PostInfo } from '@/types/PostInfo'
import type { FullCommentInfo } from '@/types/CommentInfo'
import { useDeleteComment } from '@/hooks/comments'
import { can } from '../../auth'

interface CommentProps extends StackProps {
  post?: PostInfo
  comment: FullCommentInfo
  linkToComment?: boolean
}

export const Comment = ({ post, comment, linkToComment, ...rest } : CommentProps) => {
  const navigate = useNavigate()

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
    <Stack {...rest}>
      <Group justify="space-between">
        <Author source={comment}>
          {
            !comment.author.deleted && comment.author.id === post?.author?.id && (
              <Badge variant="outline" radius="sm">OP</Badge>
            )
          }
        </Author>

        <PostMenu
          source={comment}
          showPrivilegedActions={can(user, comment.author)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Group>
      <Box pos="relative">
        {
          linkToComment && (
            <Overlay backgroundOpacity={0} component={Link} to="/comment/$commentId" params={{ commentId: comment.id }} />
          )
        }
        <UserContent content={comment.body} />
      </Box>
      <VoteButton value={userReaction ?? undefined} count={vote} onSelect={handleReact} />
    </Stack>
  )
}
