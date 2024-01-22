import { createTheme, DefaultMantineColor, type MantineColorsTuple } from '@mantine/core'

const forumBlueGray: MantineColorsTuple = [
  '#ecf5ff',
  '#dde6f2',
  '#bdcade',
  '#99adca',
  '#7b95b9',
  '#6785b0',
  '#5c7dac',
  '#4c6b97',
  '#415f88',
  '#32527a',
]

export const theme = createTheme({
  primaryColor: 'forumBlueGray',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji',
  },
  colors: {
    forumBlueGray,
  },
})

type ExtendedCustomColors = DefaultMantineColor | 'forumBlueGray'

declare module '@mantine/core' {
  export interface MantineThemeColorsOverride {
    colors: Record<ExtendedCustomColors, MantineColorsTuple>
  }
}
