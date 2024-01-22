import { Box, Popover, Button } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { DotLottiePlayer } from '@dotlottie/react-player'
import { Smiley } from '@phosphor-icons/react'

import styles from './styles.module.scss'
import { ReactionPicker } from '@/components'
import type { ReactionInfo } from '@/types/ReactionInfo'
import { useCallback } from 'react'

export interface ReactionButtonProps {
  reactions: ReactionInfo[]
  value?: ReactionInfo['id']
  limit?: number
  withPicker?: boolean
  onSelect?: (reaction: ReactionInfo['name'] | null) => void
  disabled?: boolean
}

export const ReactionButton = ({ reactions, value, limit = 3, withPicker, onSelect, disabled } : ReactionButtonProps) => {
  const [opened, { open, close }] = useDisclosure(false)

  const visibleReactions = reactions.slice(0, limit).filter(({ id }) => id !== value)
  const selectedReaction = reactions.find(({ id }) => id === value)

  if (selectedReaction) {
    visibleReactions.unshift(selectedReaction)
    visibleReactions.length = limit
  }

  const handleSelect = useCallback((reaction: string) => {
    close()
    onSelect?.(reaction)
  }, [close, onSelect])

  const button = (
    <Button
      variant="light"
      color={value ? 'forumBlueGray' : 'gray'}
      radius="xl"
      leftSection={visibleReactions.length ? visibleReactions.map(({ id, name }, i) => (
        <DotLottiePlayer key={id} className={styles.lottie} src={`/lottie/${name}.lottie`} style={{ zIndex: reactions.length - i }} />
      )) : (
        <Smiley size={24} />
      )}
      onMouseEnter={withPicker ? open : undefined}
      onClick={withPicker && !opened ? open : () => onSelect?.(null)}
      disabled={disabled}>
      { reactions.reduce((acc, { count }) => acc + count, 0) }
    </Button>
  )

  return withPicker ? (
    <Box onMouseLeave={close}>
      <Popover opened={opened} position="top" offset={0} zIndex={200}>
        <Popover.Target>{ button }</Popover.Target>
        <Popover.Dropdown className={styles.dropdown}>
          <ReactionPicker reactions={['Laugh', 'Love', 'Wow', 'Think', 'Sus', 'Cry', 'Angry']} onSelect={handleSelect} />
        </Popover.Dropdown>
      </Popover>
    </Box>
  ) : (
    button
  )
}
