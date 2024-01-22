import { FileRoute } from '@tanstack/react-router'

import { Box, Button, Flex, Grid, Group, Loader, Menu, Stack, Text } from '@mantine/core'
import { CaretDown, ChatsTeardrop, Check, ClockCountdown, Fire, XCircle } from '@phosphor-icons/react'

import { Navbar, Post, Sidebar } from '@/components'
import { usePosts } from '@/hooks/posts'
import { useVirtualized } from '@/hooks/virtualized'
import { usePreference } from '@/hooks/usePreference'

const Index = () => {
  const sortOptions = {
    latest: ClockCountdown,
    popular: Fire,
    replies: ChatsTeardrop,
  }
  const [sort, setSort] = usePreference('preferredSort', 'latest')

  const postsData = usePosts({ sort })
  const { props, data: posts, isLoading, isError } = useVirtualized(postsData)

  return (
    <div>
      <Navbar />
      <Grid p="sm" gutter="sm">
        <Grid.Col span={{ base: 12, sm: 5, md: 4, xl: 3 }} offset={{ xl: 1 }} order={{ base: 2, sm: 1 }}>
          <Sidebar />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7, md: 8, xl: 7 }} order={{ base: 1, sm: 2 }}>
          <Flex justify="flex-end" mb="md">
            <Menu position="bottom-end" withArrow>
              <Menu.Target>
                <Button variant="light" color="gray" rightSection={<CaretDown size={14} weight="bold" />}>Sorted by { sort }</Button>
              </Menu.Target>
              <Menu.Dropdown>
                {
                  Object.entries(sortOptions).map(([sortOption, Icon]) => (
                    <Menu.Item
                      key={sortOption}
                      color={sort === sortOption ? 'forumBlueGray' : 'gray'}
                      leftSection={<Icon size={16} weight={sort === sortOption ? 'bold' : 'regular'} />}
                      rightSection={sort === sortOption && <Check size={16} weight="bold" />}
                      onClick={() => setSort(sortOption as keyof typeof sortOptions)}>
                      Sort by { sortOption }
                    </Menu.Item>
                  ))
                }
              </Menu.Dropdown>
            </Menu>
          </Flex>
          <Box {...props}>
            {
              posts?.map(({ data, props }) => (
                <Box {...props}>
                  <Post post={data} linkToPost mb="sm" />
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

export const Route = new FileRoute('/').createRoute({
  component: Index,
})
