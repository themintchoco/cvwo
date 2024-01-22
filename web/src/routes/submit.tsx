import { useCallback } from 'react'

import { FileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { Accordion, Grid, Paper, Text, Title } from '@mantine/core'

import { Navbar, PostComposer } from '@/components'
import { useCreatePost } from '@/hooks/posts'
import { meOpts } from '@/hooks/me'

const Submit = () => {
  const navigate = useNavigate()
  const createPost = useCreatePost()

  const handlePost = useCallback((vars: { title: string, body: string, tags: string }) => {
    createPost.mutate(vars, {
      onSuccess: (post) => {
        navigate({ to: '/post/$postId', params: { postId: post.id.toString() } })
      },
    })
  }, [createPost, navigate])

  return (
    <div>
      <Navbar />
      <Grid p="sm" gutter="sm">
        <Grid.Col span={{ base: 12, xl: 11 }} offset={{ xl: 1 }}>
          <Title order={2} size="h3" my="xl">Create a post</Title>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7, md: 8, xl: 7 }} offset={{ xl: 1 }}>
          <PostComposer height="30dvh" onPost={handlePost} loading={createPost.isPending} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 5, md: 4, xl: 3 }} >
          <Paper withBorder>
            <Text p="md">Before you post, please review our Community Guidelines. </Text>
            <Accordion>
              <Accordion.Item value="a">
                <Accordion.Control icon="😊">Be Respectful and Courteous</Accordion.Control>
                <Accordion.Panel>Remember to treat fellow community members with respect. Avoid using offensive language, personal attacks, or engaging in harassment. Kindness and constructive feedback foster a positive environment.</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="b">
                <Accordion.Control icon="🎯">Stay On Topic</Accordion.Control>
                <Accordion.Panel>Ensure your posts are relevant to the forum's subject matter. Off-topic posts may be moved or removed to maintain the focus and quality of discussions.</Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="c">
                <Accordion.Control icon="🗑️">No Spam or Self-Promotion</Accordion.Control>
                <Accordion.Panel>Avoid posting spam, advertisements, or excessive self-promotion. Contributions should add value to the discussion and not be primarily for personal gain.</Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  )
}

export const Route = new FileRoute('/submit').createRoute({
  component: Submit,
  beforeLoad: async ({ context: { queryClient } }) => {
    const me = await queryClient.ensureQueryData(meOpts())
    if (!me) throw redirect({ to: '/login', search: { redirect: '/submit' } })
  },
})
