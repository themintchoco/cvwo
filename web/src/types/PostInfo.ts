import type { UserInfo } from './UserInfo'
import type { DeletedInfo } from './DeletedInfo'

export type FullPostInfo = {
  id: number
  title: string
  body: string
  author: UserInfo
  commentCount: number
  tags: number[]
  createdAt: string
  updatedAt: string
  deleted: false
}

export type PostInfo = FullPostInfo | DeletedInfo<FullPostInfo, 'id'>
