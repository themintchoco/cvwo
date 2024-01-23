import { FileRoute } from '@tanstack/react-router'

import useRelativeTime from '@nkzw/use-relative-time'
import { Badge, Blockquote, Box, Grid, Group, Loader, Paper, Stack, Tabs, Text, Title } from '@mantine/core'
import { Quotes, XCircle } from '@phosphor-icons/react'

import { Avatar, Comment, Navbar, Post } from '@/components'
import { userOpts } from '@/hooks/users'
import { usePosts } from '@/hooks/posts'
import { useComments } from '@/hooks/comments'
import { useVirtualized } from '@/hooks/virtualized'
import { ClientError } from '../error'

const User = () => {
  const user = Route.useLoaderData()

  const userCreationTime = useRelativeTime(user.deleted ? 0 : Date.parse(user.createdAt))

  const postsData = usePosts({ filter: { author: user.username } })
  const { props: postsProps, data: posts, isLoading: postsLoading, isError: postsError } = useVirtualized(postsData)

  const commentsData = useComments({ filter: { author: user.username } })
  const { props: commentsProps, data: comments, isLoading: commentsLoading, isError: commentsError } = useVirtualized(commentsData)

  return (
    <div>
      <Navbar />
      <Grid p="sm">
        <Grid.Col span={{ base: 12, sm: 8 }} offset={{ sm: 2 }}>
          <Stack justify="center">
            <Paper shadow="lg" my="xl" p="xl" radius="lg">
              <Group gap="xl">
                <Avatar userId={user.id} size="xl" radius="lg" />
                <Stack gap={0} flex="2 0">
                  <Group wrap="nowrap">
                    <Title order={2}>{ user.username }</Title>
                    <Badge variant="light">{ user.role }</Badge>
                  </Group>
                  <Text>Joined { userCreationTime }</Text>
                </Stack>
                <Group justify="space-evenly" flex="1 0" wrap="nowrap">
                  <Stack gap={0} align="center">
                    <Text size="xl" fw={800}>{ user.postCount }</Text>
                    <Text size="sm">posts</Text>
                  </Stack>
                  <Stack gap={0} align="center">
                    <Text size="xl" fw={800}>{ user.commentCount }</Text>
                    <Text size="sm">comments</Text>
                  </Stack>
                </Group>
              </Group>
            </Paper>

            {
              user.bio && (
                <Blockquote radius="lg" cite={`— ${user.username}`} icon={<Quotes size={24} weight="fill" />}>
                  { user.bio }
                </Blockquote>
              )
            }

            <Tabs defaultValue="posts">
              <Tabs.List my="lg">
                <Tabs.Tab value="posts">
                  Posts
                </Tabs.Tab>
                <Tabs.Tab value="comments">
                  Comments
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="posts">
                <Box {...postsProps}>
                  {
                    postsLoading ? (
                      <Group justify="center">
                        <Loader size="lg" />
                      </Group>
                    ) : posts?.length ? posts.map(({ data, props }) => (
                      <Box {...props}>
                        <Post post={data} linkToPost mb="sm" />
                      </Box>
                    )) : (
                      <Stack align="center">
                        <Text size="lg" fw={600}>No posts yet</Text>
                        <Text>When {user.username} posts something, it will appear here.</Text>
                      </Stack>
                    )
                  }

                  {
                    postsError && (
                      <Stack align="center">
                        <XCircle size={96} weight="light" color="red"/>
                        <Text size="lg" fw={600}>An error has occurred</Text>
                        <Text>Please try again later.</Text>
                      </Stack>
                    )
                  }
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="comments">
                <Box {...commentsProps}>
                  {
                    commentsLoading ? (
                      <Group justify="center">
                        <Loader size="lg" />
                      </Group>
                    ) : comments?.length ? comments.map(({ data, props }) => (
                      <Box {...props}>
                        <Paper shadow="sm" radius="md" p="lg" mb="sm">
                          <Comment comment={data} linkToComment />
                        </Paper>
                      </Box>
                    )) : (
                      <Stack align="center">
                        <Text size="lg" fw={600}>No comments yet</Text>
                        <Text>When {user.username} comments something, it will appear here.</Text>
                      </Stack>
                    )
                  }

                  {
                    commentsError && (
                      <Stack align="center">
                        <XCircle size={96} weight="light" color="red"/>
                        <Text size="lg" fw={600}>An error has occurred</Text>
                        <Text>Please try again later.</Text>
                      </Stack>
                    )
                  }
                </Box>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  )
}

export const Route = new FileRoute('/user/$userId').createRoute({
  component: User,
  loader: async ({ context: { queryClient }, params: { userId } }) => {
    const user = await queryClient.ensureQueryData(userOpts(parseInt(userId)))
    if (user.deleted) throw new ClientError(404, 'User not found')
    return user
  },
})
