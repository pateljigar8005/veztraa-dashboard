// ** Reducers Imports
import navbar from './navbar'
import layout from './layout'
import auth from './authentication'
import todo from '@src/views/apps/todo/store'
import chat from '@src/views/apps/chat/store'
import users from '@src/views/apps/user/store'
import email from '@src/views/apps/email/store'
import kanban from '@src/views/apps/kanban/store'
import clients from '@src/views/apps/client/store'
import invoice from '@src/views/apps/invoice/store'
import calendar from '@src/views/apps/calendar/store'
import projects from '@src/views/apps/project/store'
import quotations from '@src/views/apps/quotation/store'
import contracts from '@src/views/apps/contract/store'
import paymentMethods from '@src/views/apps/payment-method/store'
import currencies from '@src/views/apps/currency/store'
import serviceItems from '@src/views/apps/service-item/store'
import termsTemplates from '@src/views/apps/terms-template/store'
import pdfDesignerTemplates from '@src/views/apps/pdf-designer/store'
import roles from '@src/views/apps/roles-permissions/roles/store'

const rootReducer = {
  auth,
  todo,
  chat,
  email,
  users,
  kanban,
  navbar,
  layout,
  invoice,
  clients,
  calendar,
  projects,
  quotations,
  contracts,
  paymentMethods,
  currencies,
  serviceItems,
  termsTemplates,
  pdfDesignerTemplates,
  roles
}

export default rootReducer
