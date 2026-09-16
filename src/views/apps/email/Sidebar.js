// ** React Imports
import { Link, useParams } from 'react-router-dom'

// ** Third Party Components
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Mail, Send, Edit2, Trash } from 'react-feather'

// ** Reactstrap Imports
import { Button, ListGroup, ListGroupItem, Badge, Spinner } from 'reactstrap'

// ** Icon per real IMAP folder key (see backend Mailbox::FOLDERS)
const folderIcons = {
  INBOX: Mail,
  Sent: Send,
  Drafts: Edit2,
  Trash: Trash
}

const Sidebar = props => {
  // ** Props
  const { store, sidebarOpen, toggleCompose, setOpenMail, setSidebarOpen } = props

  // ** Vars
  const params = useParams()
  const activeFolder = params.folder || 'INBOX'

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
              {store.foldersLoading && !store.folders.length ? (
                <div className='d-flex justify-content-center py-2'>
                  <Spinner size='sm' color='primary' />
                </div>
              ) : (
                <ListGroup tag='div' className='list-group-messages'>
                  {store.folders.map(folder => {
                    const Icon = folderIcons[folder.key] || Mail
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
                        {folder.unreadCount > 0 ? (
                          <Badge className='float-end' color='light-primary' pill>
                            {folder.unreadCount}
                          </Badge>
                        ) : null}
                      </ListGroupItem>
                    )
                  })}
                </ListGroup>
              )}
            </PerfectScrollbar>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
