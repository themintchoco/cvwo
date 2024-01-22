import { useCallback } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'

import { Button, Card, Group, Overlay, Text, type CardProps } from '@mantine/core'
import { openContextModal } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { ChatTeardropText } from '@phosphor-icons/react'

import styles from './styles.module.scss'
import { Author, PostMenu, ReactionButton, Tag, UserContent } from '@/components'
import { useCurrentUser } from '@/hooks/users'
import { usePostReactions, useUpdatePostReaction, useUserPostReaction } from '@/hooks/reactions'
import type { FullPostInfo } from '@/types/PostInfo'
import { useDeletePost } from '@/hooks/posts'
import { can } from '../../auth'

interface PostProps extends CardProps {
  post: FullPostInfo
  linkToPost?: boolean
  hideTags?: boolean
}

export const Post = ({ post, linkToPost, hideTags, ...rest } : PostProps) => {
  const navigate = useNavigate()

  const { data: user } = useCurrentUser()
  const { data: userReaction } = useUserPostReaction(post.id, user?.id)
  const { data: postReactions } = usePostReactions(post.id)

  const updatePostReaction = useUpdatePostReaction()
  const deletePost = useDeletePost()

  const handleReact = useCallback((reaction: string | null) => {
    if (!user) return openContextModal({
      modal: 'signUp',
      centered: true,
      innerProps: { action: 'react' },
    })

    updatePostReaction.mutate({ postId: post.id, reaction })
  }, [post, updatePostReaction, user])

  const handleEdit = () => {
    navigate({ to: '/edit', search: { post: post.id } })
  }

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
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
    <Card shadow="sm" radius="md" p="lg" {...rest}>
      <Card.Section py="md" inheritPadding>
        <Group justify="space-between">
          <Author source={post} />
          <PostMenu
            source={post}
            showPrivilegedActions={can(user, post.author)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Group>
      </Card.Section>
      <Card.Section mah={300} className={styles.content} inheritPadding>
        {
          linkToPost && (
            <Overlay backgroundOpacity={0} component={Link} to="/post/$postId" params={{ postId: post.id.toString() }} />
          )
        }
        <Text size="lg" fw={600}>{ post.title }</Text>
        <UserContent content={post.body} />
      </Card.Section>
      <Card.Section pb="md" inheritPadding>
        {
          !hideTags && post.tags.length > 0 && (
            <Group gap="xs" mb="md">
              {
                post.tags.map((tagId) => (
                  <Tag key={tagId} tagId={tagId} compact />
                ))
              }
            </Group>
          )
        }
        <Group>
          <Button
            variant="light"
            color="gray"
            radius="xl"
            leftSection={<ChatTeardropText size={24} />}
            component={Link}
            to="/post/$postId"
            params={{ postId: post.id.toString() }}>
            { post.commentCount }
          </Button>
          <ReactionButton reactions={postReactions ?? []} value={userReaction?.id} onSelect={handleReact} withPicker />
        </Group>
      </Card.Section>
    </Card>
  )
}
