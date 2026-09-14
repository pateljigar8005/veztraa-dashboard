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

const ClientList = lazy(() => import('../../views/apps/client/list'))
const ClientForm = lazy(() => import('../../views/apps/client/form'))
const ClientView = lazy(() => import('../../views/apps/client/view'))

const PaymentMethodList = lazy(() => import('../../views/apps/payment-method/list'))
const PaymentMethodForm = lazy(() => import('../../views/apps/payment-method/form'))
const CurrencyList = lazy(() => import('../../views/apps/currency/list'))
const CurrencyForm = lazy(() => import('../../views/apps/currency/form'))

const ServiceItemList = lazy(() => import('../../views/apps/service-item/list'))
const ServiceItemForm = lazy(() => import('../../views/apps/service-item/form'))

const ProjectList = lazy(() => import('../../views/apps/project/list'))
const ProjectForm = lazy(() => import('../../views/apps/project/form'))

const TermsTemplateList = lazy(() => import('../../views/apps/terms-template/list'))
const TermsTemplateForm = lazy(() => import('../../views/apps/terms-template/form'))
const PdfDesignerTemplateList = lazy(() => import('../../views/apps/pdf-designer/list'))
const PdfDesignerTemplateForm = lazy(() => import('../../views/apps/pdf-designer/form'))

const QuotationList = lazy(() => import('../../views/apps/quotation/list'))
const QuotationForm = lazy(() => import('../../views/apps/quotation/form'))

const ContractList = lazy(() => import('../../views/apps/contract/list'))
const ContractForm = lazy(() => import('../../views/apps/contract/form'))

const Roles = lazy(() => import('../../views/apps/roles-permissions/roles'))
const RoleForm = lazy(() => import('../../views/apps/roles-permissions/roles/form'))

const CompanySettings = lazy(() => import('../../views/apps/company'))

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
    path: '/quotation/add'
  },
  {
    element: <QuotationForm />,
    path: '/quotation/edit/:id'
  },
  {
    element: <ContractList />,
    path: '/contract'
  },
  {
    element: <ContractForm />,
    path: '/contract/add'
  },
  {
    element: <ContractForm />,
    path: '/contract/edit/:id'
  },
  {
    element: <CompanySettings />,
    path: '/company'
  }
]

export default AppRoutes
