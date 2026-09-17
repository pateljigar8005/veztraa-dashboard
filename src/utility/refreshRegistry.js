// ** Maps a route to how to refetch that page's data. Every standard list
// module already re-dispatches its own getData(currentParams) after add/
// update/delete (see e.g. client/store's addClient) - this reuses that exact
// same idiom so the navbar refresh icon can re-run "this page's own fetch,
// with its own current filters/pagination" for every module, instead of a
// full window.location.reload() (see NavbarBookmarks.js's handleRefresh).
// Email has its own dedicated hidden-trigger mechanism (its data comes from
// a local cache, not a plain Redux list fetch - see isEmailRoute) and isn't
// registered here.

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
import { getData as getTimesheetData } from '@src/views/apps/timesheet/store'
import { getData as getTimesheetActivityData } from '@src/views/apps/timesheet-activity/store'
import { getData as getTeamMemberData } from '@src/views/apps/team-member/store'
import { getData as getPortfolioItemData } from '@src/views/apps/portfolio/store'
import { getData as getCaseStudyData } from '@src/views/apps/case-study/store'
import { getData as getJobListingData } from '@src/views/apps/job-listing/store'
import { getData as getUserData } from '@src/views/apps/user/store'
import { getData as getPdfDesignerTemplateData } from '@src/views/apps/pdf-designer/store'
import { getAllData as getRolesAllData } from '@src/views/apps/roles-permissions/roles/store'
import { fetchTasks as fetchKanbanTasks, fetchBoards as fetchKanbanBoards } from '@src/views/apps/kanban/store'
import { getTasks as getTodoTasks } from '@src/views/apps/todo/store'
import {
  fetchEvents as fetchCalendarEvents,
  fetchKanbanTaskEvents as fetchCalendarKanbanEvents,
  fetchTodoTaskEvents as fetchCalendarTodoEvents
} from '@src/views/apps/calendar/store'

// Each entry's refetch(dispatch, getState) mirrors exactly what that
// module's own mount effect and post-mutation refetches already dispatch.
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
  { pattern: /^\/timesheet$/, refetch: (d, g) => d(getTimesheetData(g().timesheets.params)) },
  { pattern: /^\/timesheet-activity$/, refetch: (d, g) => d(getTimesheetActivityData(g().timesheetActivities.params)) },
  { pattern: /^\/team-member$/, refetch: (d, g) => d(getTeamMemberData(g().teamMembers.params)) },
  { pattern: /^\/portfolio$/, refetch: (d, g) => d(getPortfolioItemData(g().portfolioItems.params)) },
  { pattern: /^\/case-study$/, refetch: (d, g) => d(getCaseStudyData(g().caseStudies.params)) },
  { pattern: /^\/job-listing$/, refetch: (d, g) => d(getJobListingData(g().jobListings.params)) },
  { pattern: /^\/user$/, refetch: (d, g) => d(getUserData(g().users.params)) },
  { pattern: /^\/pdf-designer$/, refetch: (d, g) => d(getPdfDesignerTemplateData(g().pdfDesignerTemplates.params)) },
  // Roles has no pagination/filters - it's a small fixed list, fetched whole.
  { pattern: /^\/roles$/, refetch: d => d(getRolesAllData()) },
  { pattern: /^\/kanban$/, refetch: d => { d(fetchKanbanBoards()); d(fetchKanbanTasks()) } },
  { pattern: /^\/todo(\/.*)?$/, refetch: (d, g) => d(getTodoTasks(g().todo.params)) },
  {
    pattern: /^\/calendar$/,
    refetch: (d, g) => {
      d(fetchCalendarEvents(g().calendar.selectedCalendars))
      d(fetchCalendarKanbanEvents())
      d(fetchCalendarTodoEvents())
    }
  }
]

// Returns true if a matching module's refetch actually ran (so the caller
// knows it doesn't need to fall back to a full reload), false otherwise.
export const refetchForRoute = (pathname, dispatch, getState) => {
  const entry = registry.find(e => e.pattern.test(pathname))
  if (!entry) return false
  entry.refetch(dispatch, getState)
  return true
}
