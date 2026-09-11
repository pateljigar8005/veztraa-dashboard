// ** Reducers Imports
import navbar from './navbar'
import layout from './layout'
import auth from './authentication'
import todo from '@src/views/apps/todo/store'
import chat from '@src/views/apps/chat/store'
import users from '@src/views/apps/user/store'
import email from '@src/views/apps/email/store'
import kanban from '@src/views/apps/kanban/store'
import invoice from '@src/views/apps/invoice/store'
import calendar from '@src/views/apps/calendar/store'

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
  calendar
}

export default rootReducer
