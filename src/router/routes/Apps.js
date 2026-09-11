// ** React Imports
import { lazy } from 'react'
import { Navigate } from 'react-router-dom'

const Chat = lazy(() => import('../../views/apps/chat'))
const Todo = lazy(() => import('../../views/apps/todo'))
const Email = lazy(() => import('../../views/apps/email'))
const Kanban = lazy(() => import('../../views/apps/kanban'))
const Calendar = lazy(() => import('../../views/apps/calendar'))

const InvoiceAdd = lazy(() => import('../../views/apps/invoice/add'))
const InvoiceList = lazy(() => import('../../views/apps/invoice/list'))
const InvoiceEdit = lazy(() => import('../../views/apps/invoice/edit'))
const InvoicePrint = lazy(() => import('../../views/apps/invoice/print'))
const InvoicePreview = lazy(() => import('../../views/apps/invoice/preview'))

const UserList = lazy(() => import('../../views/apps/user/list'))
const UserView = lazy(() => import('../../views/apps/user/view'))

const Roles = lazy(() => import('../../views/apps/roles-permissions/roles'))

const AppRoutes = [
  {
    element: <Email />,
    path: '/email',
    meta: {
      appLayout: true,
      className: 'email-application'
    }
  },
  {
    element: <Email />,
    path: '/email/:folder',
    meta: {
      appLayout: true,
      className: 'email-application'
    }
  },
  {
    element: <Email />,
    path: '/email/label/:label',
    meta: {
      appLayout: true,
      className: 'email-application'
    }
  },
  {
    element: <Email />,
    path: '/email/:filter'
  },
  {
    path: '/chat',
    element: <Chat />,
    meta: {
      appLayout: true,
      className: 'chat-application'
    }
  },
  {
    element: <Todo />,
    path: '/todo',
    meta: {
      appLayout: true,
      className: 'todo-application'
    }
  },
  {
    element: <Todo />,
    path: '/todo/:filter',
    meta: {
      appLayout: true,
      className: 'todo-application'
    }
  },
  {
    element: <Todo />,
    path: '/todo/tag/:tag',
    meta: {
      appLayout: true,
      className: 'todo-application'
    }
  },
  {
    element: <Calendar />,
    path: '/calendar'
  },
  {
    element: <Kanban />,
    path: '/kanban',
    meta: {
      appLayout: true,
      className: 'kanban-application'
    }
  },
  {
    element: <InvoiceList />,
    path: '/invoice'
  },
  {
    element: <InvoicePreview />,
    path: '/invoice/preview/:id'
  },
  {
    path: '/invoice/preview',
    element: <Navigate to='/invoice/preview/4987' />
  },
  {
    element: <InvoiceEdit />,
    path: '/invoice/edit/:id'
  },
  {
    path: '/invoice/edit',
    element: <Navigate to='/invoice/edit/4987' />
  },
  {
    element: <InvoiceAdd />,
    path: '/invoice/add'
  },
  {
    path: '/invoice/print',
    element: <InvoicePrint />,
    meta: {
      layout: 'blank'
    }
  },
  {
    element: <UserList />,
    path: '/user'
  },
  {
    path: '/user/view',
    element: <Navigate to='/user/view/1' />
  },
  {
    element: <UserView />,
    path: '/user/view/:id'
  },
  {
    element: <Roles />,
    path: '/roles'
  }
]

export default AppRoutes
