import {
  Mail,
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
  DollarSign,
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
    header: 'Apps & Pages'
  },
  {
    id: 'calendar',
    title: 'Calendar',
    icon: <Calendar size={20} />,
    navLink: '/calendar'
  },
  {
    id: 'email',
    title: 'Email',
    icon: <Mail size={20} />,
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
    icon: <CheckSquare size={20} />,
    navLink: '/todo'
  },
  {
    id: 'timesheets',
    title: 'Timesheet',
    icon: <Clock size={20} />,
    navLink: '/timesheet'
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
    header: 'Website'
  },
  {
    id: 'caseStudies',
    title: 'Case Studies',
    icon: <Award size={20} />,
    navLink: '/case-study'
  },
  {
    id: 'jobListings',
    title: 'Job Listings',
    icon: <List size={20} />,
    navLink: '/job-listing'
  },
  {
    id: 'portfolioItems',
    title: 'Portfolio',
    icon: <Image size={20} />,
    navLink: '/portfolio'
  },
  {
    id: 'teamMembers',
    title: 'Team',
    icon: <Users size={20} />,
    navLink: '/team-member'
  },
  {
    header: 'Templates'
  },
  {
    id: 'termsTemplates',
    title: 'Terms & Conditions',
    icon: <BookOpen size={20} />,
    navLink: '/terms-template'
  },
  {
    id: 'emailTemplates',
    title: 'Email Template',
    icon: <Mail size={20} />,
    navLink: '/email-template'
  },
  {
    id: 'paymentMethods',
    title: 'Payment Methods',
    icon: <CreditCard size={20} />,
    navLink: '/payment-method'
  },
  {
    id: 'pdfDesignerTemplates',
    title: 'PDF Designer',
    icon: <Layout size={20} />,
    navLink: '/pdf-designer'
  },
  {
    header: 'Reports'
  },
  {
    id: 'invoiceReports',
    title: 'Invoice Report',
    icon: <BarChart2 size={20} />,
    navLink: '/reports/invoice'
  },
  {
    id: 'timesheetReports',
    title: 'Timesheet Report',
    icon: <Clock size={20} />,
    navLink: '/reports/timesheet'
  },
  {
    header: 'Settings'
  },
  {
    id: 'holidays',
    title: 'Holidays',
    icon: <Sun size={20} />,
    navLink: '/holiday'
  },
  {
    id: 'company',
    title: 'Company',
    icon: <Globe size={20} />,
    navLink: '/company'
  },
  {
    id: 'currencies',
    title: 'Currency',
    icon: <DollarSign size={20} />,
    navLink: '/currency'
  },
  {
    id: 'industries',
    title: 'Industry',
    icon: <Briefcase size={20} />,
    navLink: '/industry'
  },
  {
    id: 'projects',
    title: 'Project',
    icon: <Folder size={20} />,
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
    icon: <Package size={20} />,
    navLink: '/service-item'
  },
  {
    id: 'timesheetActivities',
    title: 'Timesheet Activity',
    icon: <Clock size={20} />,
    navLink: '/timesheet-activity'
  },
  {
    id: 'users',
    title: 'User',
    icon: <User size={20} />,
    navLink: '/user'
  }
]