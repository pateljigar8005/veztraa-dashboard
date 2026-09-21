import navbar from './navbar'
import layout from './layout'
import auth from './authentication'
import dashboard from '@src/views/dashboard/store'
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
import eventCategories from '@src/views/apps/event-category/store'
import currencies from '@src/views/apps/currency/store'
import industries from '@src/views/apps/industry/store'
import serviceItems from '@src/views/apps/service-item/store'
import termsTemplates from '@src/views/apps/terms-template/store'
import emailTemplates from '@src/views/apps/email-template/store'
import holidays from '@src/views/apps/holiday/store'
import pdfDesignerTemplates from '@src/views/apps/pdf-designer/store'
import roles from '@src/views/apps/roles-permissions/roles/store'
import teamMembers from '@src/views/apps/team-member/store'
import portfolioItems from '@src/views/apps/portfolio/store'
import caseStudies from '@src/views/apps/case-study/store'
import jobListings from '@src/views/apps/job-listing/store'
import timesheets from '@src/views/apps/timesheet/store'
import timesheetActivities from '@src/views/apps/timesheet-activity/store'
import contactSubmissions from '@src/views/apps/contact-submission/store'
import jobApplications from '@src/views/apps/job-application/store'
import apiKeys from '@src/views/apps/api-key/store'
import activityLogs from '@src/views/apps/activity-log/store'
import notifications from './notifications'

const rootReducer = {
  auth,
  dashboard,
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
  eventCategories,
  currencies,
  industries,
  serviceItems,
  termsTemplates,
  emailTemplates,
  holidays,
  pdfDesignerTemplates,
  roles,
  teamMembers,
  portfolioItems,
  caseStudies,
  jobListings,
  timesheets,
  timesheetActivities,
  contactSubmissions,
  jobApplications,
  apiKeys,
  activityLogs,
  notifications
}

export default rootReducer