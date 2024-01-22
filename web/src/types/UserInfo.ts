import type { DeletedInfo } from './DeletedInfo'

export type FullUserInfo = {
  id: number
  username: string
  role: string
  bio?: string
  avatar?: string
  postCount?: number
  commentCount?: number
  createdAt: string
  deleted: false
}

export type UserInfo = FullUserInfo | DeletedInfo<FullUserInfo>
