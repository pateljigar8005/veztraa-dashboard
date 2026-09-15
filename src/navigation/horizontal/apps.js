// ** Icons Import
import {
  Box,
  Mail,
  User,
  Shield,
  Calendar,
  FileText,
  CheckSquare,
  Briefcase,
  CreditCard,
  Package,
  Folder,
  BookOpen,
  PenTool,
  Settings,
  DollarSign,
  Globe,
  Layout,
  Users,
  Image,
  Award,
  List,
  Clock
} from 'react-feather'

export default [
  {
    id: 'apps',
    title: 'Apps',
    icon: <Box />,
    children: [
      {
        id: 'calendar',
        title: 'Calendar',
        icon: <Calendar />,
        navLink: '/calendar'
      },
      {
        id: 'email',
        title: 'Email',
        icon: <Mail />,
        navLink: '/email'
      },
      {
        id: 'kanban',
        title: 'Kanban',
        icon: <CheckSquare size={20} />,
        navLink: '/kanban'
      },
      {
        id: 'timesheets',
        title: 'Timesheet',
        icon: <Clock />,
        navLink: '/timesheet'
      },
      {
        id: 'todo',
        title: 'Todo',
        icon: <CheckSquare />,
        navLink: '/todo'
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
    id: 'website',
    title: 'Website',
    icon: <Globe />,
    children: [
      {
        id: 'caseStudies',
        title: 'Case Studies',
        icon: <Award />,
        navLink: '/case-study'
      },
      {
        id: 'jobListings',
        title: 'Job Listings',
        icon: <List />,
        navLink: '/job-listing'
      },
      {
        id: 'portfolioItems',
        title: 'Portfolio',
        icon: <Image />,
        navLink: '/portfolio'
      },
      {
        id: 'teamMembers',
        title: 'Team',
        icon: <Users />,
        navLink: '/team-member'
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
        id: 'currencies',
        title: 'Currency',
        icon: <DollarSign />,
        navLink: '/currency'
      },
      {
        id: 'industries',
        title: 'Industry',
        icon: <Briefcase />,
        navLink: '/industry'
      },
      {
        id: 'paymentMethods',
        title: 'Payment Methods',
        icon: <CreditCard />,
        navLink: '/payment-method'
      },
      {
        id: 'pdfDesignerTemplates',
        title: 'PDF Designer',
        icon: <Layout />,
        navLink: '/pdf-designer'
      },
      {
        id: 'projects',
        title: 'Project',
        icon: <Folder />,
        navLink: '/project'
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
        id: 'termsTemplates',
        title: 'Terms Templates',
        icon: <BookOpen />,
        navLink: '/terms-template'
      },
      {
        id: 'timesheetActivities',
        title: 'Timesheet Activity',
        icon: <Clock />,
        navLink: '/timesheet-activity'
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
