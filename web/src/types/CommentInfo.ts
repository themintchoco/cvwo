import { UserInfo } from './UserInfo'
import { DeletedInfo } from './DeletedInfo'

export type FullCommentInfo = {
  id: number
  postId: number
  body: string
  author: UserInfo
  createdAt: string
  updatedAt: string
  deleted: false
}

export type CommentInfo = FullCommentInfo | DeletedInfo<FullCommentInfo, 'id' | 'postId'>
