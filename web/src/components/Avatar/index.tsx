import { forwardRef } from 'react'

import { Avatar as MantineAvatar, createPolymorphicComponent, type AvatarProps as MantineAvatarProps } from '@mantine/core'

import { useUser } from '@/hooks/users'

interface AvatarProps extends MantineAvatarProps {
  userId?: number
}

export const Avatar = createPolymorphicComponent<'div', AvatarProps>(forwardRef<HTMLDivElement, AvatarProps>(({ userId, ...rest }, ref) => {
  const { data: user } = useUser(userId)

  return (
    <MantineAvatar src={user?.avatar} {...rest} ref={ref} />
  )
}))
