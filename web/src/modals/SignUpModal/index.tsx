import { Link } from '@tanstack/react-router'

import { Button, Text } from '@mantine/core'
import { ContextModalProps } from '@mantine/modals'

interface SignUpModalInnerProps {
  action?: string
}

export const SignUpModal = ({ context, id, innerProps: { action } } : ContextModalProps<SignUpModalInnerProps>) => {
  return (
    <>
      <Text size="xl" fw={700}>You need an account { action && `to ${action}` }</Text>
      <Text my="lg">Join the community to discuss experiences, ask questions, and offer assistance to other community members.</Text>
      <Button
        variant="filled"
        size="lg"
        radius="lg"
        fullWidth
        component={Link}
        to="/register"
        search={{ redirect: location.pathname }}
        onClick={() => context.closeModal(id)}>
        Sign up
      </Button>
      <Button
        variant="outline"
        size="lg"
        radius="lg"
        fullWidth
        my="sm"
        component={Link}
        to="/login"
        search={{ redirect: location.pathname }}
        onClick={() => context.closeModal(id)}>
        Sign in
      </Button>
      <Button variant="transparent" color="gray" fullWidth mt="md" onClick={() => context.closeModal(id)}>Maybe later</Button>
    </>
  )
}
