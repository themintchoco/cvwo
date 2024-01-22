import { Text } from '@mantine/core'
import type { Icon, IconProps } from '@phosphor-icons/react'

interface ColoredIconProps extends IconProps {
  icon: Icon
}

export const ColoredIcon = ({ icon: Icon, color, size, ...rest } : ColoredIconProps) => {
  return (
    <Text c={color} h={size} lh={0}>
      <Icon size={size} {...rest}></Icon>
    </Text>
  )
}
