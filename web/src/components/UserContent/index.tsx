import { TypographyStylesProvider } from '@mantine/core'
import { Interweave, type FilterInterface } from 'interweave'

interface UserContentProps {
  content: string
  noMarkup?: boolean
}

export const UserContent = ({ content, noMarkup }: UserContentProps) => {
  return (
    <TypographyStylesProvider p={0} m={0}>
      <Interweave content={content} filters={[filter]} noHtml={noMarkup} />
    </TypographyStylesProvider>
  )
}

const filter: FilterInterface = {
  node(name, node) {
    if (name === 'a') {
      node.setAttribute('target', '_blank')
    }

    if (node.childElementCount === 0) {
      node.textContent += ' '
    }

    return node
  },
}
