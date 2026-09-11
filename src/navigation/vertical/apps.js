// ** Icons Import
import { Mail, MessageSquare, CheckSquare, Calendar, FileText, User, Shield } from 'react-feather'

export default [
  {
    header: 'Apps & Pages'
  },
  {
    id: 'email',
    title: 'Email',
    icon: <Mail size={20} />,
    navLink: '/email'
  },
  {
    id: 'chat',
    title: 'Chat',
    icon: <MessageSquare size={20} />,
    navLink: '/chat'
  },
  {
    id: 'todo',
    title: 'Todo',
    icon: <CheckSquare size={20} />,
    navLink: '/todo'
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: <Calendar size={20} />,
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
    icon: <FileText size={20} />,
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
    icon: <User size={20} />,
    navLink: '/user'
  }
]
