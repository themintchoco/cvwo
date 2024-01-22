import { useState, type FormEventHandler } from 'react'

import { FileRoute, Link, redirect } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'

import { Alert, Anchor, Button, Center, Paper, PasswordInput, Stack, Text, TextInput } from '@mantine/core'
import { WarningCircle } from '@phosphor-icons/react'

import { meOpts } from '@/hooks/me'
import { login } from '../auth'
import { router } from '../router'

const Login = () => {
  const search = Route.useSearch()

  const [alert, setAlert] = useState('')

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },

    async onSubmit({ value }) {
      const success = await login(value)

      if (success) router.history.push(search.redirect ?? '/')
      else setAlert('Incorrect username or password')
    },
  })

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <Center h="100dvh" p="xl">
      <Paper shadow="xl" radius="md" p="xl" w={{ base: '100%', xs: 600 }}>
        {
          alert && (
            <Alert variant="filled" color="red" title={alert} icon={<WarningCircle />} mb="xl"></Alert>
          )
        }

        <Text size="xl" fw={600} mb="xl">
          Sign in to
          <Text size="xl" fw={700} variant="gradient" gradient={{ from: 'pink', to: 'violet', deg: 90 }} span> forum. </Text>
        </Text>

        <form.Provider>
          <form onSubmit={handleSubmit}>
            <form.Field name="username">
              {
                (field) => (
                  <TextInput
                    variant="filled"
                    size="md"
                    label="Username"
                    required
                    my="md"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    error={field.state.meta.errors?.[0]}
                    autoFocus
                  />
                )
              }
            </form.Field>

            <form.Field name="password">
              {
                (field) => (
                  <PasswordInput
                    variant="filled"
                    size="md"
                    label="Password"
                    required
                    my="md"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    error={field.state.meta.errors?.[0]}
                  />
                )
              }
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {
                ([canSubmit, isSubmitting]) => (
                  <Button
                    variant="filled"
                    size="lg"
                    radius="lg"
                    fullWidth
                    type="submit"
                    loading={isSubmitting}
                    my="xl"
                    disabled={!canSubmit}>
                    Sign in
                  </Button>
                )
              }
            </form.Subscribe>
          </form>
        </form.Provider>

        <Stack align="center" gap={0}>
          <Text>Don&rsquo;t have an account? <Anchor component={Link} to="/register" search={search}>Sign up</Anchor></Text>
        </Stack>
      </Paper>
    </Center>
  )
}

export const Route = new FileRoute('/login').createRoute({
  component: Login,
  validateSearch: (search: Record<string, string>) => {
    return { redirect: search.redirect ?? '/' }
  },
  beforeLoad: async ({ context: { queryClient } }) => {
    const me = await queryClient.fetchQuery(meOpts())
    if (me) throw redirect({ to: '/account' })
  },
})
