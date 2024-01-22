import { useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'

import { useDebouncedValue, useDisclosure } from '@mantine/hooks'
import { Box, Burger, Button, Collapse, Combobox, Group, Loader, Paper, Popover, Stack, Text, TextInput, Title, UnstyledButton, useCombobox } from '@mantine/core'
import { CaretRight, MagnifyingGlass } from '@phosphor-icons/react'

import { Avatar, UserContent } from '@/components'
import { useCurrentUser } from '@/hooks/users'
import { usePosts } from '@/hooks/posts'
import { logout } from '../../auth'
import { useBreakpoint } from '@/hooks/breakpoint'

export const Navbar = () => {
  const navigate = useNavigate()

  const combobox = useCombobox()
  const [value, setValue] = useState('')
  const [query] = useDebouncedValue(value, 500)

  const { data: posts, isLoading } = usePosts({ filter: { query }, sort: 'popular' })

  const { data: user } = useCurrentUser()
  const [opened, { toggle }] = useDisclosure()

  const small = useBreakpoint({ max: 'sm' })

  const handleSearchSelect = (postId: string) => {
    setValue('')
    combobox.closeDropdown()
    navigate({ to: '/post/$postId', params: { postId } })
  }

  const searchTarget = (
    <>
      <Combobox.Target>
        <TextInput
          variant="filled"
          size="lg"
          radius="md"
          leftSection={<MagnifyingGlass weight="bold" />}
          rightSection={isLoading && (<Loader size={18} />)}
          placeholder="Search forums"
          aria-label="Search"
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          onFocus={() => combobox.openDropdown()} />
      </Combobox.Target>
      <Combobox.Dropdown hidden={query.length === 0}>
        <Combobox.Options>
          {
            posts && posts.pages[0].length > 0 ? posts.pages[0].map((post) => (
              <Combobox.Option key={post.id} value={post.id.toString()}>
                <Text fw={600}>{ post.title }</Text>
                <Text size="sm" lineClamp={3} component="div">
                  <UserContent content={post.body} noMarkup />
                </Text>
              </Combobox.Option>
            )) : (
              <Combobox.Empty>No results found</Combobox.Empty>
            )
          }
        </Combobox.Options>
      </Combobox.Dropdown>
    </>
  )

  return (
    <Paper shadow="xs">
      <Combobox store={combobox} shadow="xl" onOptionSubmit={handleSearchSelect}>
        <Group grow justify="space-between" p="sm">
          <Box>
            <UnstyledButton component={Link} to="/">
              <Title order={1} display="inline">forum.</Title>
            </UnstyledButton>
          </Box>

          { !small && searchTarget }

          <Group justify="flex-end">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm"/>

            <Group visibleFrom="sm" wrap="nowrap">
              {
                user ? (
                  <Popover shadow="md" width={250} withArrow trapFocus>
                    <Popover.Target>
                      <Avatar userId={user.id} radius="xl" component="button" />
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack align="center" gap={0}>
                        <UnstyledButton component={Link} to="/user/$userId" params={{ userId: user.id }}>
                          <Stack align="center" gap={0}>
                            <Avatar userId={user.id} size="xl" radius="xl" my="xs" />
                            <Text size="lg" fw={500}>{ user.username }</Text>
                            <Text size="sm" c="dimmed" tt="capitalize">{ user.role }</Text>
                          </Stack>
                        </UnstyledButton>
                        <Button variant="subtle" color="gray" fullWidth mt="lg" component={Link} to="/account">Account settings</Button>
                        <Button variant="subtle" color="red" fullWidth onClick={() => logout()}>Sign out</Button>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                ) : (
                  <>
                    <Button variant="filled" size="lg" radius="lg" component={Link} to="/register" search={{ redirect: location.pathname }}>Sign up</Button>
                    <Button variant="subtle" size="lg" radius="lg" component={Link} to="/login" search={{ redirect: location.pathname }}>Sign in</Button>
                  </>
                )
              }
            </Group>
          </Group>
        </Group>

        <Collapse in={opened} p="sm" hiddenFrom="sm">
          { small && opened && searchTarget }

          {
            user ? (
              <>
                <Paper shadow="md" radius="lg" p="lg" my="lg" bg="forumBlueGray" c="white" component={Link} to="/user/$userId" params={{ userId: user.id }}>
                  <Group>
                    <Avatar userId={user.id} color="white" radius="xl" />
                    <Stack gap={0} flex="1">
                      <Text size="lg" fw={500}>{ user.username }</Text>
                      <Text size="sm" opacity={0.7} tt="capitalize">{ user.role }</Text>
                    </Stack>
                    <CaretRight size={24} />
                  </Group>
                </Paper>
                <Button variant="light" color="gray" size="lg" radius="lg" fullWidth mt="lg" component={Link} to="/account">Account settings</Button>
                <Button variant="light" size="lg" radius="lg" color="red" fullWidth my="sm" onClick={() => logout()}>Sign out</Button>
              </>
            ) : (
              <>
                <Button variant="filled" size="lg" radius="lg" fullWidth mt="lg" component={Link} to="/register" search={{ redirect: location.pathname }}>Sign up</Button>
                <Button variant="outline" size="lg" radius="lg" fullWidth my="sm" component={Link} to="/login" search={{ redirect: location.pathname }}>Sign in</Button>
              </>
            )
          }
        </Collapse>
      </Combobox>
    </Paper>
  )
}
