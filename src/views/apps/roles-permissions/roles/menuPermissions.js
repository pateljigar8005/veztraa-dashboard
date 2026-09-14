export const menuPermissionGroups = [
  {
    section: 'Apps & Pages',
    items: [
      { id: 'email', title: 'Email' },
      { id: 'chat', title: 'Chat' },
      { id: 'todo', title: 'Todo' },
      { id: 'calendar', title: 'Calendar' },
      { id: 'kanban', title: 'Kanban' },
      { id: 'projects', title: 'Project' }
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
    section: 'Settings',
    items: [
      { id: 'company', title: 'Company' },
      { id: 'users', title: 'User' },
      { id: 'roles-permissions', title: 'Roles & Permissions' },
      { id: 'serviceItems', title: 'Service Item' },
      { id: 'paymentMethods', title: 'Payment Methods' },
      { id: 'termsTemplates', title: 'Terms Templates' },
      { id: 'pdfDesignerTemplates', title: 'PDF Designer' },
      { id: 'currencies', title: 'Currency' }
    ]
  }
]

export const allMenuPermissionIds = menuPermissionGroups.flatMap(group => group.items.map(item => item.id))
