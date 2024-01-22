import { useRef, useState, type FormEvent } from 'react'

import { FileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, type FormApi } from '@tanstack/react-form'

import { Box, Button, Fieldset, FileButton, Grid, Group, LoadingOverlay, PasswordInput, Stack, Switch, Text, Textarea, Title, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { openConfirmModal } from '@mantine/modals'
import { notifications } from '@mantine/notifications'

import { Avatar, Navbar } from '@/components'
import { meOpts } from '@/hooks/me'
import { useDeleteUser, useDeleteUserAvatar, useUpdateUser, useUpdateUserAvatar, useUser } from '@/hooks/users'
import { usePreference } from '@/hooks/usePreference'

const Account = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const me = Route.useLoaderData()
  const { data: user } = useUser(me.id)

  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light')

  const systemReducedMotion = useReducedMotion()
  const [prefersReducedMotion, setPrefersReducedMotion] = usePreference('prefersReducedMotion', false)

  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const updateUserAvatar = useUpdateUserAvatar()
  const deleteUserAvatar = useDeleteUserAvatar()

  const [settingAvatar, setSettingAvatar] = useState(false)
  const resetRef = useRef<() => void>(null)

  const bioForm = useForm({
    defaultValues: {
      bio: user?.bio ?? '',
    },

    async onSubmit({ value: { bio } }) {
      if (!user || user.deleted) return
      updateUser.mutate({ userId: user.id, update: { bio }}, {
        onSuccess: () => {
          notifications.show({
            autoClose: 5000,
            title: 'Updated bio',
            message: 'Your bio has been updated',
            color: 'teal',
          })
        },
      })
    },
  })

  const passwordForm = useForm({
    defaultValues: {
      password: '',
    },

    async onSubmit({ value: { password } }) {
      if (!user || user.deleted) return
      updateUser.mutate({ userId: user.id, update: { password }}, {
        onSuccess: () => {
          notifications.show({
            autoClose: 5000,
            title: 'Updated password',
            message: 'Your password has been updated',
            color: 'teal',
          })
        },
      })
    },
  })

  const handleFile = (file: File | null) => {
    resetRef.current?.()

    if (!user || user.deleted) return

    if (file && file.size > parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE ?? '')) return notifications.show({
      autoClose: 5000,
      title: 'File too large',
      message: 'The file you selected is too large to upload',
      color: 'red',
    })

    setSettingAvatar(true)

    const commonOpts = {
      onSettled: () => setSettingAvatar(false),
    }

    if (file) return updateUserAvatar.mutate({ userId: user.id, avatar: file }, commonOpts)
    deleteUserAvatar.mutate({ userId: user.id }, commonOpts)
  }

  const handleFormSubmit = <T,>(form: FormApi<T>, e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  const handleDeleteUser = () => {
    if (!user || user.deleted) return

    openConfirmModal({
      title: 'Delete your account?',
      centered: true,
      children: (
        <Text size="sm">This action is not reversible. </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        deleteUser.mutate(user.id, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['me'] })
            navigate({ to: '/' })
          },
        }),
    })
  }

  return (
    <div>
      <Navbar />
      <Grid p="sm" gutter="sm">
        <Grid.Col span={{ base: 12, sm: 10 }} offset={{ sm: 2 }}>
          <Title order={2} size="h3" my="xl">Your account</Title>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 7 }} offset={{ sm: 2 }}>
          <Stack gap="xl">
            <Fieldset legend="Preferences">
              <Stack>
                <Switch
                  labelPosition="left"
                  label="Dark Mode"
                  size="md"
                  checked={computedColorScheme === 'dark'}
                  onChange={(e) => setColorScheme(e.currentTarget.checked ? 'dark' : 'light')}
                  styles={{ body: { justifyContent: 'space-between' }}}
                />
                <Switch
                  labelPosition="left"
                  label="Reduce Motion"
                  description={systemReducedMotion && 'As Reduced Motion is enabled on this device, animations will be reduced regardless of this setting.'}
                  size="md"
                  checked={prefersReducedMotion}
                  onChange={(e) => setPrefersReducedMotion(e.currentTarget.checked)}
                  styles={{ body: { justifyContent: 'space-between' }}}
                />
              </Stack>
            </Fieldset>

            <Fieldset legend="Profile Picture" pos="relative">
              <Stack align="center">
                <LoadingOverlay visible={settingAvatar} overlayProps={{ blur: 2, color: 'var(--mantine-color-body)' }} />
                <Avatar userId={user?.id} radius="xl" size="xl" />

                <Group mt="sm">
                  <Button variant="light" onClick={() => handleFile(null)} disabled={!user?.avatar}>Remove</Button>
                  <FileButton onChange={handleFile} accept="image/png,image/jpeg" resetRef={resetRef}>
                    {
                      (props) => (
                        <Button variant="filled" {...props}>Set</Button>
                      )
                    }
                  </FileButton>
                </Group>
              </Stack>
            </Fieldset>

            <Fieldset legend="Bio">
              <bioForm.Provider>
                <form onSubmit={(e) => handleFormSubmit(bioForm, e)}>
                  <bioForm.Field name="bio">
                    {
                      (field) => (
                        <Textarea
                          autosize
                          minRows={3}
                          maxRows={6}
                          placeholder="Public Bio"
                          autoComplete="off"
                          aria-label="Bio"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      )
                    }
                  </bioForm.Field>

                  <bioForm.Subscribe
                    selector={(state) => [state.isTouched, state.isSubmitting]}>
                    {
                      ([isTouched, isSubmitting]) => (
                        <Group justify="end" mt="sm">
                          <Button variant="filled" type="submit" loading={isSubmitting} disabled={!isTouched}>Update Bio</Button>
                        </Group>
                      )
                    }
                  </bioForm.Subscribe>
                </form>
              </bioForm.Provider>
            </Fieldset>

            <Fieldset legend="Change Password">
              <passwordForm.Provider>
                <form onSubmit={(e) => handleFormSubmit(passwordForm, e)}>
                  <Group align="start" justify="end">
                    <passwordForm.Field
                      name="password"
                      validators={{
                        onChange(field) {
                          if (field.value.length < 8) {
                            return 'Password must be at least 8 characters long'
                          }
                        },
                      }}>
                      {
                        (field) => (
                          <PasswordInput
                            autoComplete="new-password"
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            error={field.state.meta.errors[0]}
                            flex="1"
                            miw={200} />
                        )
                      }
                    </passwordForm.Field>

                    <passwordForm.Subscribe
                      selector={(state) => [state.canSubmit, state.isSubmitting]}>
                      {
                        ([canSubmit, isSubmitting]) => (
                          <Button variant="filled" type="submit" loading={isSubmitting} disabled={!canSubmit}>Change Password</Button>
                        )
                      }
                    </passwordForm.Subscribe>
                  </Group>
                </form>
              </passwordForm.Provider>
            </Fieldset>

            <Fieldset legend="Danger zone" >
              <Group justify="end">
                <Box flex="1" miw={200}>
                  <Text fw={600}>Permanently delete your account</Text>
                  <Text>Deleting your account will remove your profile and disassociate all your posts and comments from your account. This action is not reversible. </Text>
                </Box>
                <Button variant="filled" color="red" onClick={handleDeleteUser}>Delete account</Button>
              </Group>
            </Fieldset>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  )
}

export const Route = new FileRoute('/account').createRoute({
  component: Account,
  beforeLoad: async ({ context: { queryClient } }) => {
    const me = await queryClient.ensureQueryData(meOpts())
    if (!me) throw redirect({ to: '/login', search: { redirect: '/account' } })
    return { me }
  },
  loader: ({ context: { me } }) => me,
})
