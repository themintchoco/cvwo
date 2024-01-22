import { Link, useNavigate } from '@tanstack/react-router'

import useRelativeTime from '@nkzw/use-relative-time'
import { Badge, Box, Button, Group, Popover, Stack, Text, UnstyledButton } from '@mantine/core'
import { useDisclosure, useTimeout } from '@mantine/hooks'
import { PencilSimple } from '@phosphor-icons/react'

import { Avatar, ColoredIcon } from '@/components'
import type { PostInfo } from '@/types/PostInfo'
import type { CommentInfo } from '@/types/CommentInfo'

interface AuthorProps {
  source: PostInfo | CommentInfo
  children?: React.ReactNode
}

export const Author = ({ source, children } : AuthorProps) => {
  const navigate = useNavigate()

  const [opened, { open, close }] = useDisclosure(false)
  const { start: startCloseDelay, clear: clearCloseDelay } = useTimeout(close, 100)

  const sourceCreationTime = useRelativeTime(source.deleted ? 0 : Date.parse(source.createdAt))
  const userCreationTime = useRelativeTime(source.deleted || source.author.deleted ? 0 : Date.parse(source.author.createdAt))

  const handleMouseEnter = () => {
    clearCloseDelay()
    open()
  }

  const handleMoustLeave = () => {
    startCloseDelay()
  }

  return (
    <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMoustLeave}>
      <Popover opened={!source.deleted && !source.author.deleted && opened} position="bottom-start" withArrow shadow="md" offset={0} zIndex={200}>
        <Popover.Target>
          <UnstyledButton onClick={() => !source.deleted && !source.author.deleted && !opened && navigate({ to: '/user/$userId', params: { userId: source.author.id.toString() } })}>
            <Group>
              <Avatar userId={source.author?.id} radius="xl" size="md" />
              <Stack gap={0}>
                <Group gap="xs">
                  <Text size="sm">{ source.author?.username ?? '[deleted]' }</Text>
                  { children }
                </Group>

                {
                  !source.deleted && (
                    <Group align="center" gap="xs">
                      <Text size="xs">{ sourceCreationTime }</Text>
                      {
                        source.updatedAt !== source.createdAt && (
                          <ColoredIcon icon={PencilSimple} color="dimmed" size={14} weight="fill" />
                        )
                      }
                    </Group>
                  )
                }
              </Stack>
            </Group>
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown maw={350}>
          <Stack>
            <Group>
              <Avatar userId={source.author?.id} radius="md" size="lg" />
              <Stack gap={0}>
                <Group gap="xs">
                  <Text fw={500}>{ source.author?.username }</Text>
                  <Badge variant="light" size="sm">{ source.author?.role }</Badge>
                </Group>
                <Text size="sm">Joined { userCreationTime }</Text>
              </Stack>
            </Group>

            {
              source.author?.bio && (
                <Box>
                  <Text c="dimmed">Bio</Text>
                  <Text lineClamp={4}>{ source.author.bio }</Text>
                </Box>
              )
            }

            <Button component={Link} to="/user/$userId" params={{ userId: source.author?.id }}>View profile</Button>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </Box>
  )
}
