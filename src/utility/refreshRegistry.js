
import { getData as getClientData } from '@src/views/apps/client/store'
import { getData as getInvoiceData } from '@src/views/apps/invoice/store'
import { getData as getQuotationData } from '@src/views/apps/quotation/store'
import { getData as getContractData } from '@src/views/apps/contract/store'
import { getData as getCurrencyData } from '@src/views/apps/currency/store'
import { getData as getIndustryData } from '@src/views/apps/industry/store'
import { getData as getPaymentMethodData } from '@src/views/apps/payment-method/store'
import { getData as getProjectData } from '@src/views/apps/project/store'
import { getData as getServiceItemData } from '@src/views/apps/service-item/store'
import { getData as getTermsTemplateData } from '@src/views/apps/terms-template/store'
import { getData as getEmailTemplateData } from '@src/views/apps/email-template/store'
import { getData as getHolidayData } from '@src/views/apps/holiday/store'
import { getData as getTimesheetData } from '@src/views/apps/timesheet/store'
import { getData as getTimesheetActivityData } from '@src/views/apps/timesheet-activity/store'
import { getData as getTeamMemberData } from '@src/views/apps/team-member/store'
import { getData as getPortfolioItemData } from '@src/views/apps/portfolio/store'
import { getData as getCaseStudyData } from '@src/views/apps/case-study/store'
import { getData as getJobListingData } from '@src/views/apps/job-listing/store'
import { getData as getContactSubmissionData } from '@src/views/apps/contact-submission/store'
import { getData as getJobApplicationData } from '@src/views/apps/job-application/store'
import { getAllData as getApiKeyAllData } from '@src/views/apps/api-key/store'
import { getData as getUserData } from '@src/views/apps/user/store'
import { getData as getPdfDesignerTemplateData } from '@src/views/apps/pdf-designer/store'
import { getAllData as getRolesAllData } from '@src/views/apps/roles-permissions/roles/store'
import { getTasks as getTodoTasks } from '@src/views/apps/todo/store'
import {
  fetchEvents as fetchCalendarEvents,
  fetchTodoTaskEvents as fetchCalendarTodoEvents
} from '@src/views/apps/calendar/store'

const registry = [
  { pattern: /^\/client$/, refetch: (d, g) => d(getClientData(g().clients.params)) },
  { pattern: /^\/invoice$/, refetch: (d, g) => d(getInvoiceData(g().invoice.params)) },
  { pattern: /^\/quotation$/, refetch: (d, g) => d(getQuotationData(g().quotations.params)) },
  { pattern: /^\/contract$/, refetch: (d, g) => d(getContractData(g().contracts.params)) },
  { pattern: /^\/currency$/, refetch: (d, g) => d(getCurrencyData(g().currencies.params)) },
  { pattern: /^\/industry$/, refetch: (d, g) => d(getIndustryData(g().industries.params)) },
  { pattern: /^\/payment-method$/, refetch: (d, g) => d(getPaymentMethodData(g().paymentMethods.params)) },
  { pattern: /^\/project$/, refetch: (d, g) => d(getProjectData(g().projects.params)) },
  { pattern: /^\/service-item$/, refetch: (d, g) => d(getServiceItemData(g().serviceItems.params)) },
  { pattern: /^\/terms-template$/, refetch: (d, g) => d(getTermsTemplateData(g().termsTemplates.params)) },
  { pattern: /^\/email-template$/, refetch: (d, g) => d(getEmailTemplateData(g().emailTemplates.params)) },
  { pattern: /^\/holiday$/, refetch: (d, g) => d(getHolidayData(g().holidays.params)) },
  { pattern: /^\/timesheet$/, refetch: (d, g) => d(getTimesheetData(g().timesheets.params)) },
  { pattern: /^\/timesheet-activity$/, refetch: (d, g) => d(getTimesheetActivityData(g().timesheetActivities.params)) },
  { pattern: /^\/team-member$/, refetch: (d, g) => d(getTeamMemberData(g().teamMembers.params)) },
  { pattern: /^\/portfolio$/, refetch: (d, g) => d(getPortfolioItemData(g().portfolioItems.params)) },
  { pattern: /^\/case-study$/, refetch: (d, g) => d(getCaseStudyData(g().caseStudies.params)) },
  { pattern: /^\/job-listing$/, refetch: (d, g) => d(getJobListingData(g().jobListings.params)) },
  { pattern: /^\/contact-submission$/, refetch: (d, g) => d(getContactSubmissionData(g().contactSubmissions.params)) },
  { pattern: /^\/job-application$/, refetch: (d, g) => d(getJobApplicationData(g().jobApplications.params)) },
  { pattern: /^\/api-key$/, refetch: d => d(getApiKeyAllData()) },
  { pattern: /^\/user$/, refetch: (d, g) => d(getUserData(g().users.params)) },
  { pattern: /^\/pdf-designer$/, refetch: (d, g) => d(getPdfDesignerTemplateData(g().pdfDesignerTemplates.params)) },
  { pattern: /^\/roles$/, refetch: d => d(getRolesAllData()) },
  { pattern: /^\/todo(\/.*)?$/, refetch: (d, g) => d(getTodoTasks(g().todo.params)) },
  {
    pattern: /^\/calendar$/,
    refetch: (d, g) => {
      d(fetchCalendarEvents(g().calendar.selectedCalendars))
      d(fetchCalendarTodoEvents())
    }
  }
]

export const refetchForRoute = (pathname, dispatch, getState) => {
  const entry = registry.find(e => e.pattern.test(pathname))
  if (!entry) return false
  entry.refetch(dispatch, getState)
  return true
}