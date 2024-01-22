import { Route as rootRoute } from './routes/__root'
import { Route as SubmitRoute } from './routes/submit'
import { Route as RegisterRoute } from './routes/register'
import { Route as LoginRoute } from './routes/login'
import { Route as EditRoute } from './routes/edit'
import { Route as AccountRoute } from './routes/account'
import { Route as IndexRoute } from './routes/index'
import { Route as UserUserIdRoute } from './routes/user.$userId'
import { Route as TagTagIdRoute } from './routes/tag.$tagId'
import { Route as PostPostIdRoute } from './routes/post.$postId'
import { Route as CommentCommentIdRoute } from './routes/comment.$commentId'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      parentRoute: typeof rootRoute
    }
    '/account': {
      parentRoute: typeof rootRoute
    }
    '/edit': {
      parentRoute: typeof rootRoute
    }
    '/login': {
      parentRoute: typeof rootRoute
    }
    '/register': {
      parentRoute: typeof rootRoute
    }
    '/submit': {
      parentRoute: typeof rootRoute
    }
    '/comment/$commentId': {
      parentRoute: typeof rootRoute
    }
    '/post/$postId': {
      parentRoute: typeof rootRoute
    }
    '/tag/$tagId': {
      parentRoute: typeof rootRoute
    }
    '/user/$userId': {
      parentRoute: typeof rootRoute
    }
  }
}

Object.assign(IndexRoute.options, {
  path: '/',
  getParentRoute: () => rootRoute,
})

Object.assign(AccountRoute.options, {
  path: '/account',
  getParentRoute: () => rootRoute,
})

Object.assign(EditRoute.options, {
  path: '/edit',
  getParentRoute: () => rootRoute,
})

Object.assign(LoginRoute.options, {
  path: '/login',
  getParentRoute: () => rootRoute,
})

Object.assign(RegisterRoute.options, {
  path: '/register',
  getParentRoute: () => rootRoute,
})

Object.assign(SubmitRoute.options, {
  path: '/submit',
  getParentRoute: () => rootRoute,
})

Object.assign(CommentCommentIdRoute.options, {
  path: '/comment/$commentId',
  getParentRoute: () => rootRoute,
})

Object.assign(PostPostIdRoute.options, {
  path: '/post/$postId',
  getParentRoute: () => rootRoute,
})

Object.assign(TagTagIdRoute.options, {
  path: '/tag/$tagId',
  getParentRoute: () => rootRoute,
})

Object.assign(UserUserIdRoute.options, {
  path: '/user/$userId',
  getParentRoute: () => rootRoute,
})

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  AccountRoute,
  EditRoute,
  LoginRoute,
  RegisterRoute,
  SubmitRoute,
  CommentCommentIdRoute,
  PostPostIdRoute,
  TagTagIdRoute,
  UserUserIdRoute,
])
