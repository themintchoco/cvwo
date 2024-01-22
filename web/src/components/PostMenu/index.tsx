import { ActionIcon, Menu, Text } from '@mantine/core'
import { openConfirmModal } from '@mantine/modals'
import { useClipboard } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { DotsThree, Pencil, ShareFat, Trash } from '@phosphor-icons/react'

import type { PostInfo } from '@/types/PostInfo'
import type { CommentInfo } from '@/types/CommentInfo'

interface PostMenuProps {
  source: PostInfo | CommentInfo
  showPrivilegedActions?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export const PostMenu = ({ source, showPrivilegedActions, onEdit, onDelete } : PostMenuProps) => {
  const clipboard = useClipboard()

  const sourceType = 'title' in source ? 'post' : 'comment'

  const handleCopy = () => {
    clipboard.copy(`${location.origin}/${sourceType}/${source.id}`)

    notifications.show({
      autoClose: 5000,
      title: 'Link copied',
      message: `The link to this ${sourceType} has been copied to your clipboard`,
      color: 'teal',
    })
  }

  const handleDelete = () => {
    openConfirmModal({
      title: `Delete ${sourceType}?`,
      centered: true,
      children: (
        <Text size="sm">This action cannot be undone. </Text>
      ),
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: onDelete,
    })
  }

  return (
    <Menu position="bottom-end" shadow="sm" menuItemTabIndex={0}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" radius="xl">
          <DotsThree size={32} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Item leftSection={<ShareFat size={16} />} onClick={handleCopy}>Copy link</Menu.Item>
        {
          showPrivilegedActions && (
            <>
              <Menu.Divider />
              <Menu.Item leftSection={<Pencil size={16} />} onClick={onEdit}>Edit</Menu.Item>
              <Menu.Item color="red" leftSection={<Trash size={16} />} onClick={handleDelete}>Delete</Menu.Item>
            </>
          )
        }
      </Menu.Dropdown>
    </Menu>
  )
}
