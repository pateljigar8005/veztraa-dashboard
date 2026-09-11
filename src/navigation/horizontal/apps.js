// ** Icons Import
import { Box, Mail, User, Shield, Calendar, FileText, CheckSquare, MessageSquare } from 'react-feather'

export default [
  {
    id: 'apps',
    title: 'Apps',
    icon: <Box />,
    children: [
      {
        id: 'email',
        title: 'Email',
        icon: <Mail />,
        navLink: '/email'
      },
      {
        id: 'chat',
        title: 'Chat',
        icon: <MessageSquare />,
        navLink: '/chat'
      },
      {
        id: 'todo',
        title: 'Todo',
        icon: <CheckSquare />,
        navLink: '/todo'
      },
      {
        id: 'calendar',
        title: 'Calendar',
        icon: <Calendar />,
        navLink: '/calendar'
      },
      {
        id: 'kanban',
        title: 'Kanban',
        icon: <CheckSquare size={20} />,
        navLink: '/kanban'
      },
      {
        id: 'invoiceApp',
        title: 'Invoice',
        icon: <FileText />,
        navLink: '/invoice'
      },
      {
        id: 'roles-permissions',
        title: 'Roles & Permissions',
        icon: <Shield size={20} />,
        navLink: '/roles'
      },
      {
        id: 'users',
        title: 'User',
        icon: <User />,
        navLink: '/user'
      }
    ]
  }
]
