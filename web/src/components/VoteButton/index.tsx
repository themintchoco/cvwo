import { Button } from '@mantine/core'
import { ArrowFatDown, ArrowFatUp } from '@phosphor-icons/react'

import { ReactionInfo } from '@/types/ReactionInfo'

export interface VoteButtonProps {
  value?: ReactionInfo
  count: number
  onSelect: (reaction: string) => void
}

export const VoteButton = ({ value, count, onSelect } : VoteButtonProps) => {
  return (
    <Button.Group>
      <Button
        variant={value?.name === 'Upvote' ? 'filled' : 'light'}
        color="red"
        radius="xl"
        pr={count >= 0 ? 'xs' : 0}
        leftSection={<ArrowFatUp size={24} weight={value?.name === 'Upvote' ? 'fill' : 'regular'} />}
        onClick={() => onSelect?.('Upvote')}>
        {count >= 0 && count}
      </Button>
      <Button
        variant={value?.name === 'Downvote' ? 'filled' : 'light'}
        color="indigo"
        radius="xl"
        pl={count < 0 ? 'xs' : 0}
        rightSection={<ArrowFatDown size={24} weight={value?.name === 'Downvote' ? 'fill' : 'regular'} />}
        onClick={() => onSelect?.('Downvote')}>
        {count < 0 && count}
      </Button>
    </Button.Group>
  )
}
