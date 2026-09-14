// ** Icons Import
import {
  Box,
  Mail,
  User,
  Shield,
  Calendar,
  FileText,
  CheckSquare,
  MessageSquare,
  Briefcase,
  CreditCard,
  Package,
  Folder,
  BookOpen,
  PenTool,
  Settings,
  DollarSign,
  Globe,
  Layout
} from 'react-feather'

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
        id: 'projects',
        title: 'Project',
        icon: <Folder />,
        navLink: '/project'
      }
    ]
  },
  {
    id: 'billing',
    title: 'Billing',
    icon: <DollarSign />,
    children: [
      {
        id: 'clients',
        title: 'Client',
        icon: <Briefcase />,
        navLink: '/client'
      },
      {
        id: 'quotations',
        title: 'Quotation',
        icon: <PenTool />,
        navLink: '/quotation'
      },
      {
        id: 'contracts',
        title: 'Contract',
        icon: <FileText />,
        navLink: '/contract'
      },
      {
        id: 'invoiceApp',
        title: 'Invoice',
        icon: <FileText />,
        navLink: '/invoice'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings />,
    children: [
      {
        id: 'company',
        title: 'Company',
        icon: <Globe />,
        navLink: '/company'
      },
      {
        id: 'users',
        title: 'User',
        icon: <User />,
        navLink: '/user'
      },
      {
        id: 'roles-permissions',
        title: 'Roles & Permissions',
        icon: <Shield size={20} />,
        navLink: '/roles'
      },
      {
        id: 'serviceItems',
        title: 'Service Item',
        icon: <Package />,
        navLink: '/service-item'
      },
      {
        id: 'paymentMethods',
        title: 'Payment Methods',
        icon: <CreditCard />,
        navLink: '/payment-method'
      },
      {
        id: 'termsTemplates',
        title: 'Terms Templates',
        icon: <BookOpen />,
        navLink: '/terms-template'
      },
      {
        id: 'pdfDesignerTemplates',
        title: 'PDF Designer',
        icon: <Layout />,
        navLink: '/pdf-designer'
      },
      {
        id: 'currencies',
        title: 'Currency',
        icon: <DollarSign />,
        navLink: '/currency'
      }
    ]
  }
]
