// ** React Imports
import { lazy } from 'react'

const Chat = lazy(() => import('../../views/apps/chat'))
const Todo = lazy(() => import('../../views/apps/todo'))
const Email = lazy(() => import('../../views/apps/email'))
const Kanban = lazy(() => import('../../views/apps/kanban'))
const Calendar = lazy(() => import('../../views/apps/calendar'))

const InvoiceList = lazy(() => import('../../views/apps/invoice/list'))
const InvoiceForm = lazy(() => import('../../views/apps/invoice/form'))
const InvoiceView = lazy(() => import('../../views/apps/invoice/view'))

const UserList = lazy(() => import('../../views/apps/user/list'))
const UserForm = lazy(() => import('../../views/apps/user/form'))
const ChangePassword = lazy(() => import('../../views/apps/change-password'))

const ClientList = lazy(() => import('../../views/apps/client/list'))
const ClientForm = lazy(() => import('../../views/apps/client/form'))
const ClientView = lazy(() => import('../../views/apps/client/view'))

const PaymentMethodList = lazy(() => import('../../views/apps/payment-method/list'))
const PaymentMethodForm = lazy(() => import('../../views/apps/payment-method/form'))
const CurrencyList = lazy(() => import('../../views/apps/currency/list'))
const CurrencyForm = lazy(() => import('../../views/apps/currency/form'))

const IndustryList = lazy(() => import('../../views/apps/industry/list'))
const IndustryForm = lazy(() => import('../../views/apps/industry/form'))

const ServiceItemList = lazy(() => import('../../views/apps/service-item/list'))
const ServiceItemForm = lazy(() => import('../../views/apps/service-item/form'))

const ProjectList = lazy(() => import('../../views/apps/project/list'))
const ProjectForm = lazy(() => import('../../views/apps/project/form'))

const TimesheetList = lazy(() => import('../../views/apps/timesheet/list'))
const TimesheetForm = lazy(() => import('../../views/apps/timesheet/form'))

const TimesheetActivityList = lazy(() => import('../../views/apps/timesheet-activity/list'))
const TimesheetActivityForm = lazy(() => import('../../views/apps/timesheet-activity/form'))

const TermsTemplateList = lazy(() => import('../../views/apps/terms-template/list'))
const TermsTemplateForm = lazy(() => import('../../views/apps/terms-template/form'))
const PdfDesignerTemplateList = lazy(() => import('../../views/apps/pdf-designer/list'))
const PdfDesignerTemplateForm = lazy(() => import('../../views/apps/pdf-designer/form'))

const QuotationList = lazy(() => import('../../views/apps/quotation/list'))
const QuotationForm = lazy(() => import('../../views/apps/quotation/form'))
const QuotationView = lazy(() => import('../../views/apps/quotation/view'))

const ContractList = lazy(() => import('../../views/apps/contract/list'))
const ContractForm = lazy(() => import('../../views/apps/contract/form'))
const ContractView = lazy(() => import('../../views/apps/contract/view'))

const Roles = lazy(() => import('../../views/apps/roles-permissions/roles'))
const RoleForm = lazy(() => import('../../views/apps/roles-permissions/roles/form'))

const CompanySettings = lazy(() => import('../../views/apps/company'))

const TeamMemberList = lazy(() => import('../../views/apps/team-member/list'))
const TeamMemberForm = lazy(() => import('../../views/apps/team-member/form'))

const PortfolioList = lazy(() => import('../../views/apps/portfolio/list'))
const PortfolioForm = lazy(() => import('../../views/apps/portfolio/form'))

const CaseStudyList = lazy(() => import('../../views/apps/case-study/list'))
const CaseStudyForm = lazy(() => import('../../views/apps/case-study/form'))

const JobListingList = lazy(() => import('../../views/apps/job-listing/list'))
const JobListingForm = lazy(() => import('../../views/apps/job-listing/form'))

const AppRoutes = [
  {
    // A single route with a splat, not two+ separate route config entries
    // for /email, /email/:folder, /email/:folder/:uid - useRoutes() matching
    // two different config objects for what's logically the same page has
    // itself been a remount-trigger before (see Company Settings' tab
    // history), and stacked optional segments (":folder?/:uid?") turned out
    // not to reliably match even the bare /email case in this router
    // version. The page itself splits `params['*']` into folder/uid.
    element: <Email />,
    path: '/email/*',
    meta: {
      appLayout: true,
      className: 'email-application'
    }
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
    element: <InvoiceForm />,
    path: '/invoice/add',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <InvoiceForm />,
    path: '/invoice/edit/:id',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <InvoiceView />,
    path: '/invoice/view/:id',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <UserList />,
    path: '/user'
  },
  {
    element: <UserForm />,
    path: '/user/add'
  },
  {
    element: <UserForm />,
    path: '/user/edit/:id'
  },
  {
    element: <UserForm />,
    path: '/account-settings'
  },
  {
    element: <ChangePassword />,
    path: '/change-password'
  },
  {
    element: <Roles />,
    path: '/roles'
  },
  {
    element: <RoleForm />,
    path: '/roles/add'
  },
  {
    element: <RoleForm />,
    path: '/roles/edit/:id'
  },
  {
    element: <ClientList />,
    path: '/client'
  },
  {
    element: <ClientForm />,
    path: '/client/add'
  },
  {
    element: <ClientForm />,
    path: '/client/edit/:id'
  },
  {
    element: <ClientView />,
    path: '/client/view/:id'
  },
  {
    element: <PaymentMethodList />,
    path: '/payment-method'
  },
  {
    element: <PaymentMethodForm />,
    path: '/payment-method/add'
  },
  {
    element: <PaymentMethodForm />,
    path: '/payment-method/edit/:id'
  },
  {
    element: <CurrencyList />,
    path: '/currency'
  },
  {
    element: <CurrencyForm />,
    path: '/currency/add'
  },
  {
    element: <CurrencyForm />,
    path: '/currency/edit/:id'
  },
  {
    element: <IndustryList />,
    path: '/industry'
  },
  {
    element: <IndustryForm />,
    path: '/industry/add'
  },
  {
    element: <IndustryForm />,
    path: '/industry/edit/:id'
  },
  {
    element: <ServiceItemList />,
    path: '/service-item'
  },
  {
    element: <ServiceItemForm />,
    path: '/service-item/add'
  },
  {
    element: <ServiceItemForm />,
    path: '/service-item/edit/:id'
  },
  {
    element: <ProjectList />,
    path: '/project'
  },
  {
    element: <ProjectForm />,
    path: '/project/add'
  },
  {
    element: <ProjectForm />,
    path: '/project/edit/:id'
  },
  {
    element: <TimesheetList />,
    path: '/timesheet'
  },
  {
    element: <TimesheetForm />,
    path: '/timesheet/add'
  },
  {
    element: <TimesheetForm />,
    path: '/timesheet/edit/:id'
  },
  {
    element: <TimesheetActivityList />,
    path: '/timesheet-activity'
  },
  {
    element: <TimesheetActivityForm />,
    path: '/timesheet-activity/add'
  },
  {
    element: <TimesheetActivityForm />,
    path: '/timesheet-activity/edit/:id'
  },
  {
    element: <TermsTemplateList />,
    path: '/terms-template'
  },
  {
    element: <TermsTemplateForm />,
    path: '/terms-template/add'
  },
  {
    element: <TermsTemplateForm />,
    path: '/terms-template/edit/:id'
  },
  {
    element: <PdfDesignerTemplateList />,
    path: '/pdf-designer'
  },
  {
    element: <PdfDesignerTemplateForm />,
    path: '/pdf-designer/add'
  },
  {
    element: <PdfDesignerTemplateForm />,
    path: '/pdf-designer/edit/:id'
  },
  {
    element: <QuotationList />,
    path: '/quotation'
  },
  {
    element: <QuotationForm />,
    path: '/quotation/add',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <QuotationForm />,
    path: '/quotation/edit/:id',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <QuotationView />,
    path: '/quotation/view/:id',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <ContractList />,
    path: '/contract'
  },
  {
    element: <ContractForm />,
    path: '/contract/add',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <ContractForm />,
    path: '/contract/edit/:id',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <ContractView />,
    path: '/contract/view/:id',
    meta: {
      className: 'invoice-form-page'
    }
  },
  {
    element: <CompanySettings />,
    path: '/company',
    meta: {
      appLayout: true,
      className: 'company-settings-application'
    }
  },
  {
    element: <TeamMemberList />,
    path: '/team-member'
  },
  {
    element: <TeamMemberForm />,
    path: '/team-member/add'
  },
  {
    element: <TeamMemberForm />,
    path: '/team-member/edit/:id'
  },
  {
    element: <PortfolioList />,
    path: '/portfolio'
  },
  {
    element: <PortfolioForm />,
    path: '/portfolio/add'
  },
  {
    element: <PortfolioForm />,
    path: '/portfolio/edit/:id'
  },
  {
    element: <CaseStudyList />,
    path: '/case-study'
  },
  {
    element: <CaseStudyForm />,
    path: '/case-study/add'
  },
  {
    element: <CaseStudyForm />,
    path: '/case-study/edit/:id'
  },
  {
    element: <JobListingList />,
    path: '/job-listing'
  },
  {
    element: <JobListingForm />,
    path: '/job-listing/add'
  },
  {
    element: <JobListingForm />,
    path: '/job-listing/edit/:id'
  }
]

export default AppRoutes
