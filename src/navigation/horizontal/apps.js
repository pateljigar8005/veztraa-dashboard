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
  Clock,
  Sun,
  BarChart2
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
        id: 'todo',
        title: 'Todo',
        icon: <CheckSquare />,
        navLink: '/todo'
      },
      {
        id: 'timesheets',
        title: 'Timesheet',
        icon: <Clock />,
        navLink: '/timesheet'
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
    id: 'templates',
    title: 'Templates',
    icon: <Layout />,
    children: [
      {
        id: 'termsTemplates',
        title: 'Terms & Conditions',
        icon: <BookOpen />,
        navLink: '/terms-template'
      },
      {
        id: 'emailTemplates',
        title: 'Email Template',
        icon: <Mail />,
        navLink: '/email-template'
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
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <BarChart2 />,
    children: [
      {
        id: 'invoiceReports',
        title: 'Invoice Report',
        icon: <BarChart2 />,
        navLink: '/reports/invoice'
      },
      {
        id: 'timesheetReports',
        title: 'Timesheet Report',
        icon: <Clock />,
        navLink: '/reports/timesheet'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: <Settings />,
    children: [
      {
        id: 'holidays',
        title: 'Holidays',
        icon: <Sun />,
        navLink: '/holiday'
      },
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
