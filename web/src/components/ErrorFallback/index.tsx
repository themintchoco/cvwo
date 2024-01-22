import { Divider, Grid, Group, Stack, Text, Title } from '@mantine/core'

import { ClientError } from '../../error'

interface ErrorFallbackProps {
  error: unknown
}

export const ErrorFallback = ({ error } : ErrorFallbackProps) => {
  return (
    <>
      <Grid c="white">
        <Grid.Col span={{ base: 12, sm: 6 }} offset={{ base: 0, sm: 3 }} h="100dvh">
          <Stack h="100%" justify="center">
            <Group>
              <Title order={1} fw={300} display="inline">Error <Text fw={900} inherit span>{error instanceof ClientError ? error.code : 500}</Text></Title>
              <Divider orientation="vertical" mx="md" />
              <Text size="lg" fw={600} span>{error instanceof Error && error.message || 'An error has occurred'}</Text>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
      <style>{'body { background-color: black; }'}</style>
    </>
  )
}
