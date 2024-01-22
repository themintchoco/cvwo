import { useState } from 'react'

import { Button, Combobox, Group, Paper, TextInput, useCombobox } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { Plus, X } from '@phosphor-icons/react'

import { useTags } from '@/hooks/tags'

interface TagsEditorProps {
  tags?: string[]
  onChange?: (tags: string[]) => void
  maxTags?: number
  disabled?: boolean
}

export const TagsEditor = ({ tags = [], onChange, maxTags, disabled } : TagsEditorProps) => {
  const combobox = useCombobox({
    opened: true,
    onDropdownClose: () => setEditing(false),
  })

  const [value, setValue] = useState('')
  const [query] = useDebouncedValue(value, 500)

  const [editing, setEditing] = useState(false)

  const { data } = useTags({ filter: { query } })

  const tagSuggestions = data?.filter((tag) => !tags.includes(tag.name))

  const handleChange = (value: string) => {
    value = value.toLowerCase().replace(/[^a-z-]/g, '')

    if (value.endsWith(',')) {
      handleTagSelect(value.slice(0, -1))
      return
    }

    if (value.length > 32) return

    setValue(value)
  }

  const handleTagSelect = (tag: string) => {
    onChange?.([tag, ...tags])
    setEditing(false)
    setValue('')
  }

  const handleTagRemove = (tag: string) => {
    onChange?.(tags.filter((t) => t !== tag))
  }

  return (
    <Group flex="1">
      {
        editing ? (
          <Combobox store={combobox} shadow="xl" onOptionSubmit={handleTagSelect}>
            <Combobox.Target>
              <TextInput
                radius="xl"
                placeholder="Tag"
                aria-label="Tag"
                value={value}
                onChange={(e) => handleChange(e.currentTarget.value)}
                autoFocus
              />
            </Combobox.Target>
            <Combobox.Dropdown hidden={!tagSuggestions}>
              <Combobox.Options>
                {
                  tagSuggestions && tagSuggestions.length > 0 && tagSuggestions.map((tag) => (
                    <Combobox.Option key={tag.id} value={tag.name}>
                      <Paper bg={tag.color} w={10} h={10} radius="xl" mr="xs" display="inline-block" />
                      { tag.name }
                    </Combobox.Option>
                  ))
                }

                {
                  value && !tagSuggestions?.find((tag) => tag.name === value) && (
                    <Combobox.Option value={value}>
                      <Paper bg="gray" w={10} h={10} radius="xl" mr="xs" display="inline-block" />
                      { value }
                    </Combobox.Option>
                  )
                }
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>
        ) : !disabled && (
          <Button
            variant="outline"
            color="gray"
            radius="xl"
            leftSection={<Plus size={18} weight="bold" />}
            onClick={() => setEditing(true)}
            disabled={tags.length >= (maxTags ?? Infinity)}>
            Add Tag
          </Button>
        )
      }

      {
        tags.map((tag) => (
          <Button
            key={tag}
            variant="light"
            color="gray"
            radius="xl"
            rightSection={<X size={18} weight="bold" />}
            onClick={() => handleTagRemove(tag)}
          >{ tag }</Button>
        ))
      }
    </Group>
  )
}
