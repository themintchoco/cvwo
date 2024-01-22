import { FileRoute } from '@tanstack/react-router'

import { Box, Grid, Group, Loader, Stack, Text } from '@mantine/core'
import { XCircle } from '@phosphor-icons/react'

import { Navbar, Post, Sidebar, TagBox } from '@/components'
import { usePosts } from '@/hooks/posts'
import { useVirtualized } from '@/hooks/virtualized'

const Tag = () => {
  const { tagId } = Route.useParams()


  const postsData = usePosts({ filter: { tag: tagId } })
  const { props, data: posts, isLoading, isError } = useVirtualized(postsData)

  return (
    <div>
      <Navbar />
      <Grid p="sm" gutter="sm">
        <Grid.Col span={{ base: 12, sm: 5, md: 4, xl: 3 }} offset={{ xl: 1 }} order={{ base: 2, sm: 1 }}>
          <Stack>
            <TagBox tagId={parseInt(tagId)} />
            <Sidebar />
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7, md: 8, xl: 7 }} order={{ base: 1, sm: 2 }}>
          <Box {...props}>
            {
              posts?.map(({ data, props }) => (
                <Box {...props}>
                  <Post post={data} linkToPost hideTags mb="sm" />
                </Box>
              ))
            }
          </Box>

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
        </Grid.Col>
      </Grid>
    </div>
  )
}

export const Route = new FileRoute('/tag/$tagId').createRoute({
  component: Tag,
})
