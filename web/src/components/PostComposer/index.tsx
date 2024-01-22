import { useState } from 'react'

import { Box, Button, Divider, LoadingOverlay, TextInput, Group, Paper, type MantineStyleProps } from '@mantine/core'
import { Link, RichTextEditor } from '@mantine/tiptap'
import { BubbleMenu, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Superscript from '@tiptap/extension-superscript'
import Placeholder from '@tiptap/extension-placeholder'
import { TagsEditor } from '..'

type Data = {
  title: string
  body: string
  tags: string
}

interface PostComposerProps {
  defaultTitle?: string
  defaultBody?: string
  defaultTags?: string[]
  height?: MantineStyleProps['mih']
  onPost?: (data: Data) => void
  onSave?: (data: Data) => void
  postLabel?: string
  saveLabel?: string
  disableTitle?: boolean
  disableTagging?: boolean
  hideTitle?: boolean
  hideTagging?: boolean
  loading?: boolean
}

export const PostComposer = ({ defaultTitle, defaultBody, defaultTags, height, onPost, onSave, postLabel, saveLabel, disableTitle, disableTagging, hideTitle, hideTagging, loading } : PostComposerProps) => {
  const [title, setTitle] = useState(defaultTitle ?? '')
  const [tags, setTags] = useState<string[]>(defaultTags ?? [])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      Placeholder.configure({ placeholder: 'Text' }),
    ],
    editorProps: {
      attributes: {
        style: 'flex-grow: 1',
      },
    },
    content: defaultBody,
  })

  const handlePost = () => {
    onPost?.({ title, body: editor?.getHTML() ?? '', tags: tags.join(',') })
  }

  const handleSave = () => {
    onSave?.({ title, body: editor?.getHTML() ?? '', tags: tags.join(',') })
  }

  return editor && (
    <Paper>
      <RichTextEditor editor={editor} pos="relative">
        <LoadingOverlay visible={loading} />

        {
          !hideTitle && (
            <Box px="md">
              <TextInput
                variant="unstyled"
                size="xl"
                placeholder="Title"
                aria-label="Title"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                styles={{ input: { backgroundColor: 'transparent '} }}
                disabled={disableTitle}
              />
            </Box>
          )
        }

        <RichTextEditor.Toolbar>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Undo />
            <RichTextEditor.Redo />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Link />
            <RichTextEditor.Strikethrough />
            <RichTextEditor.Code />
            <RichTextEditor.Superscript />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
            <RichTextEditor.Blockquote />
            <RichTextEditor.CodeBlock />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <BubbleMenu editor={editor}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
            <RichTextEditor.Underline />
            <RichTextEditor.Link />
          </RichTextEditor.ControlsGroup>
        </BubbleMenu>

        <RichTextEditor.Content display="flex" mih={height} />

        <Divider />

        <Box>
          <Group justify="flex-end" align="flex-end" p="sm">
            {
              !hideTagging && (
                <TagsEditor tags={tags} onChange={setTags} maxTags={3} disabled={disableTagging} />
              )
            }

            {
              onSave && (
                <Button variant="light" onClick={handleSave} disabled={loading}>{ saveLabel ?? 'Save Draft' }</Button>
              )
            }

            {
              onPost && (
                <Button variant="filled" onClick={handlePost} disabled={loading}>{ postLabel ?? 'Post' }</Button>
              )
            }
          </Group>
        </Box>
      </RichTextEditor>
    </Paper>
  )
}
