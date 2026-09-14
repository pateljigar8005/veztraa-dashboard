// ** Icons Import
import {
  Mail,
  MessageSquare,
  CheckSquare,
  Calendar,
  FileText,
  User,
  Shield,
  Briefcase,
  CreditCard,
  Package,
  Folder,
  BookOpen,
  PenTool,
  Globe,
  Layout,
  DollarSign
} from 'react-feather'

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
    id: 'projects',
    title: 'Project',
    icon: <Folder size={20} />,
    navLink: '/project'
  },
  {
    header: 'Billing'
  },
  {
    id: 'clients',
    title: 'Client',
    icon: <Briefcase size={20} />,
    navLink: '/client'
  },
  {
    id: 'quotations',
    title: 'Quotation',
    icon: <PenTool size={20} />,
    navLink: '/quotation'
  },
  {
    id: 'contracts',
    title: 'Contract',
    icon: <FileText size={20} />,
    navLink: '/contract'
  },
  {
    id: 'invoiceApp',
    title: 'Invoice',
    icon: <FileText size={20} />,
    navLink: '/invoice'
  },
  {
    header: 'Settings'
  },
  {
    id: 'company',
    title: 'Company',
    icon: <Globe size={20} />,
    navLink: '/company'
  },
  {
    id: 'users',
    title: 'User',
    icon: <User size={20} />,
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
    icon: <Package size={20} />,
    navLink: '/service-item'
  },
  {
    id: 'paymentMethods',
    title: 'Payment Methods',
    icon: <CreditCard size={20} />,
    navLink: '/payment-method'
  },
  {
    id: 'termsTemplates',
    title: 'Terms Templates',
    icon: <BookOpen size={20} />,
    navLink: '/terms-template'
  },
  {
    id: 'pdfDesignerTemplates',
    title: 'PDF Designer',
    icon: <Layout size={20} />,
    navLink: '/pdf-designer'
  },
  {
    id: 'currencies',
    title: 'Currency',
    icon: <DollarSign size={20} />,
    navLink: '/currency'
  }
]
