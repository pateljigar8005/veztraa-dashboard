export const menuPermissionGroups = [
  {
    section: 'Apps & Pages',
    items: [
      { id: 'email', title: 'Email' },
      { id: 'chat', title: 'Chat' },
      { id: 'todo', title: 'Todo' },
      { id: 'calendar', title: 'Calendar' },
      { id: 'kanban', title: 'Kanban' },
      { id: 'projects', title: 'Project' },
      { id: 'timesheets', title: 'Timesheet' }
    ]
  },
  {
    section: 'Billing',
    items: [
      { id: 'clients', title: 'Client' },
      { id: 'quotations', title: 'Quotation' },
      { id: 'contracts', title: 'Contract' },
      { id: 'invoiceApp', title: 'Invoice' }
    ]
  },
  {
    section: 'Website',
    items: [
      { id: 'teamMembers', title: 'Team' },
      { id: 'portfolioItems', title: 'Portfolio' },
      { id: 'caseStudies', title: 'Case Studies' },
      { id: 'jobListings', title: 'Job Listings' },
      { id: 'contactSubmissions', title: 'Contact Us' },
      { id: 'jobApplications', title: 'Job Applications' }
    ]
  },
  {
    section: 'Reports',
    items: [
      { id: 'invoiceReports', title: 'Invoice Report' },
      { id: 'timesheetReports', title: 'Timesheet Report' }
    ]
  },
  {
    section: 'Settings',
    items: [
      { id: 'company', title: 'Company' },
      { id: 'users', title: 'User' },
      { id: 'roles-permissions', title: 'Roles & Permissions' },
      { id: 'serviceItems', title: 'Service Item' },
      { id: 'paymentMethods', title: 'Payment Methods' },
      { id: 'eventCategories', title: 'Event Categories' },
      { id: 'termsTemplates', title: 'Terms & Conditions' },
      { id: 'emailTemplates', title: 'Email Template' },
      { id: 'holidays', title: 'Holidays' },
      { id: 'pdfDesignerTemplates', title: 'PDF Designer' },
      { id: 'currencies', title: 'Currency' },
      { id: 'industries', title: 'Industry' },
      { id: 'timesheetActivities', title: 'Timesheet Activity' },
      { id: 'apiKeys', title: 'API Keys' },
      { id: 'activityLogs', title: 'Activity Log' }
    ]
  }
]

export const allMenuPermissionIds = menuPermissionGroups.flatMap(group => group.items.map(item => item.id))