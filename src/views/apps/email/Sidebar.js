// ** React Imports
import { Link } from 'react-router-dom'

// ** Third Party Components
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Mail, Send, Edit2, Trash, AlertTriangle, Archive } from 'react-feather'

// ** Reactstrap Imports
import { Button, ListGroup, ListGroupItem, Badge } from 'reactstrap'

// ** Mirrors the backend's Mailbox::FOLDERS exactly (key = real IMAP folder
// name, label = what's shown) - the set of folders is fixed, never changes
// at runtime, so the sidebar renders this immediately instead of waiting on
// the first /mailbox/folders response just to know what folders exist. Only
// each folder's unreadCount badge actually depends on that response.
const FOLDERS = [
  { key: 'INBOX', label: 'Inbox', icon: Mail },
  { key: 'Sent', label: 'Sent', icon: Send },
  { key: 'Drafts', label: 'Drafts', icon: Edit2 },
  { key: 'spam', label: 'Junk', icon: AlertTriangle },
  { key: 'Trash', label: 'Trash', icon: Trash },
  { key: 'Archive', label: 'Archive', icon: Archive }
]

const Sidebar = props => {
  // ** Props
  const { store, activeFolder, sidebarOpen, toggleCompose, setOpenMail, setSidebarOpen } = props

  // ** The Link's route change alone already triggers index.js's effect to
  // fetch this folder (via getFolderView) - dispatching a fetch here too
  // used to mean every folder click paid for two separate IMAP logins for
  // the same data.
  const handleFolder = () => {
    setOpenMail(false)
    setSidebarOpen(false)
  }

  const handleComposeClick = () => {
    toggleCompose()
    setSidebarOpen(false)
  }

  return (
    <div
      className={classnames('sidebar-left', {
        show: sidebarOpen
      })}
    >
      <div className='sidebar'>
        <div className='sidebar-content email-app-sidebar'>
          <div className='email-app-menu'>
            <div className='form-group-compose text-center compose-btn'>
              <Button className='compose-email' color='primary' block onClick={handleComposeClick}>
                Compose
              </Button>
            </div>
            <PerfectScrollbar className='sidebar-menu-list' options={{ wheelPropagation: false }}>
              <ListGroup tag='div' className='list-group-messages'>
                {FOLDERS.map(folder => {
                  const Icon = folder.icon
                  const unreadCount = store.folders.find(f => f.key === folder.key)?.unreadCount || 0
                  return (
                    <ListGroupItem
                      key={folder.key}
                      tag={Link}
                      to={`/email/${folder.key}`}
                      onClick={handleFolder}
                      action
                      active={activeFolder === folder.key}
                    >
                      <Icon size={18} className='me-75' />
                      <span className='align-middle'>{folder.label}</span>
                      {unreadCount > 0 ? (
                        <Badge className='float-end' color='light-primary' pill>
                          {unreadCount}
                        </Badge>
                      ) : null}
                    </ListGroupItem>
                  )
                })}
              </ListGroup>
            </PerfectScrollbar>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
