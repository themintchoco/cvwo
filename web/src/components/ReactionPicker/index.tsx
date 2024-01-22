import cx from 'classix'
import { DotLottiePlayer } from '@dotlottie/react-player'
import { Group, Paper, UnstyledButton } from '@mantine/core'

import styles from './styles.module.scss'
import { useReducedMotion } from '@/hooks/reducedMotion'
import { useBreakpoint } from '@/hooks/breakpoint'

interface ReactionPickerProps {
  reactions: string[]
  onSelect?: (value: string) => void
}

export const ReactionPicker = ({ reactions, onSelect } : ReactionPickerProps) => {
  const reducedMotion = useReducedMotion()
  const small = useBreakpoint({ max: 'sm' })

  return (
    <Paper className={cx(small && styles.small)} radius="xl" shadow="xl" withBorder>
      <Group className={cx(reducedMotion && styles.reducedMotion)} wrap="nowrap" px="lg">
        {
          reactions.map((reaction) => (
            <UnstyledButton key={reaction} onClick={() => onSelect?.(reaction)}>
              <DotLottiePlayer className={styles.lottie} src={`/lottie/${reaction}.lottie`} loop={!reducedMotion} hover={!reducedMotion} />
            </UnstyledButton>
          ))
        }
      </Group>
    </Paper>
  )
}
