import { Link } from '@tanstack/react-router'

import { Box, Button, Group, Paper, Stack, Text } from '@mantine/core'

import { useCurrentUser } from '@/hooks/users'
import { useTrendingTags } from '@/hooks/tags'
import { Tag } from '..'

export const Sidebar = () => {
  const { data: user } = useCurrentUser()
  const { data: tags } = useTrendingTags()

  return (
    <Box>
      <Paper shadow="sm" radius="md" p="lg">
        <Stack>
          <Text size="lg" fw={600}>
            <Text fw={700} variant="gradient" gradient={{ from: 'pink', to: 'violet', deg: 90 }} span>forum. </Text>
            is the official support forums for
            <Text fw={700} variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 90 }} span> service. </Text>
          </Text>
          {
            user ? (
              <>
                <Text>Discuss experiences, ask questions, and offer assistance to other community members.</Text>
                <Button variant="filled" size="lg" radius="lg" fullWidth component={Link} to="/submit">New post</Button>
              </>
            ) : (
              <>
                <Text>Sign in to discuss experiences, ask questions, and offer assistance to other community members.</Text>
              </>
            )
          }
        </Stack>
      </Paper>
      <Text size="sm" c="dimmed" mt="xl" mb="xs" mx="sm">Trending Tags</Text>
      <Group gap="xs">
        {
          tags?.map((tag) => (
            <Tag key={tag.id} tagId={tag.id} />
          ))
        }
      </Group>
    </Box>
  )
}
