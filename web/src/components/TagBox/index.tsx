import { useEffect, useState } from 'react'

import { Box, Button, Group, Paper, Stack, Text, Textarea, ThemeIcon, UnstyledButton } from '@mantine/core'
import { CheckSquare } from '@phosphor-icons/react'

import { useCurrentUser } from '@/hooks/users'
import { useTag, useUpdateTag } from '@/hooks/tags'

interface TagBoxProps {
  tagId: number
}

export const TagBox = ({ tagId } : TagBoxProps) => {
  const { data: user } = useCurrentUser()

  const { data: tag } = useTag(tagId)
  const updateTag = useUpdateTag()

  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState('')
  const [tagColor, setTagColor] = useState('gray')

  useEffect(() => {
    if (!tag) return

    setDescription(tag.description)
    setTagColor(tag.color)
  }, [tag])

  const handleCancel = () => {
    if (!tag) return

    setEditing(false)
    setDescription(tag.description)
    setTagColor(tag.color)
  }

  const handleSave = () => {
    updateTag.mutate({
      tagId,
      description,
      color: tagColor,
    }, {
      onSuccess: () => {
        setEditing(false)
      },
    })
  }

  const colorRows = [['gray', 'pink', 'grape', 'violet', 'indigo', 'blue'], ['cyan', 'teal', 'green', 'lime', 'yellow', 'orange']]

  return (
    <Paper shadow="sm" radius="md" styles={{ root: { overflow: 'hidden' } }}>
      <Box h="0.75em" bg={tagColor}></Box>
      <Stack m="lg">
        <Text size="lg" fw={700}>#{ tag?.name }</Text>

        {
          editing ? (
            <>
              <Textarea
                placeholder="Description"
                autosize
                minRows={4}
                aria-label="Description"
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
              />
              <Text size="sm" c="dimmed">Tag colour</Text>
              <Group gap="xs" align="center" justify="space-around">
                {
                  colorRows.map((row) => (
                    <>
                      {
                        row.map((color) => (
                          <UnstyledButton key={color} onClick={() => setTagColor(color)}>
                            <ThemeIcon color={color} >
                              {
                                color === tagColor && (
                                  <CheckSquare size={28} weight="fill" />
                                )
                              }
                            </ThemeIcon>
                          </UnstyledButton>
                        ))
                      }

                      <Box hiddenFrom="xs" w="100%" />
                      <Box visibleFrom="sm" w="100%" />
                    </>
                  ))
                }
              </Group>
              <Group grow>
                <Button variant="light" color="gray" size="lg" radius="lg" onClick={handleCancel}>Cancel</Button>
                <Button variant="filled" color={tagColor} size="lg" radius="lg" autoContrast onClick={handleSave}>Save</Button>
              </Group>
            </>
          ) : (
            <>
              <Text size="md" styles={{ root: { whiteSpace: 'pre-line' }}}>{ description || 'No description has been added' }</Text>

              {
                user?.role === 'admin' && (
                  <Button variant="filled" color={tagColor} size="lg" radius="lg" autoContrast onClick={() => setEditing(true)}>Edit tag</Button>
                )
              }
            </>
          )
        }
      </Stack>
    </Paper>
  )
}
