import { Link } from '@tanstack/react-router'

import { Button, type ButtonProps, type ElementProps } from '@mantine/core'
import { Hash } from '@phosphor-icons/react'

import { useTag } from '@/hooks/tags'

interface TagProps extends ButtonProps, ElementProps<'a', keyof ButtonProps>  {
  tagId: number
  compact?: boolean
}

export const Tag = ({ tagId, compact, ...rest } : TagProps) => {
  const { data: tag } = useTag(tagId)

  return tag && (
    <Button
      variant="filled"
      color={tag.color}
      size={compact ? 'compact-sm' : 'sm'}
      radius="xl"
      leftSection={<Hash size={16}/>}
      autoContrast
      component={Link}
      to="/tag/$tagId"
      params={{ tagId }}
      {...rest}
    >{ tag.name }</Button>
  )
}
