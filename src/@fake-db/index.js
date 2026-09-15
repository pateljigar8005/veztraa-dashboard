import mock from './mock'

import './jwt'
import './apps/chat'
import './apps/todo'
import './apps/email'
import './apps/invoice'
import './apps/calendar'
import './cards/card-analytics'
import './cards/card-statistics'

mock.onAny().passThrough()
