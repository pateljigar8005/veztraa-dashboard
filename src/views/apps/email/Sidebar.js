import { Link } from 'react-router-dom'
import classnames from 'classnames'
import Select from 'react-select'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Mail, Send, Edit2, Trash, AlertTriangle, Archive, Clock } from 'react-feather'
import { Button, ListGroup, ListGroupItem, Badge, Label } from 'reactstrap'
import { selectThemeColors } from '@utils'

const FOLDERS = [
  { key: 'INBOX', label: 'Inbox', icon: Mail },
  { key: 'Sent', label: 'Sent', icon: Send },
  { key: 'Scheduled', label: 'Scheduled', icon: Clock },
  { key: 'Drafts', label: 'Drafts', icon: Edit2 },
  { key: 'spam', label: 'Junk', icon: AlertTriangle },
  { key: 'Trash', label: 'Trash', icon: Trash },
  { key: 'Archive', label: 'Archive', icon: Archive }
]

const Sidebar = props => {
  const {
    store,
    activeFolder,
    sidebarOpen,
    toggleCompose,
    setOpenMail,
    setSidebarOpen,
    isAdmin,
    mailboxOptions,
    viewingMailboxId,
    onSelectMailbox
  } = props

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
                {
                                                     }
                {FOLDERS.filter(folder => folder.key !== 'Scheduled' || !viewingMailboxId).map(folder => {
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
            {
                                            }
            {isAdmin && (
              <div className='email-app-mailbox-picker px-1 pb-1 pt-50'>
                <Label className='form-label small text-muted mb-50'>Browse Mailbox</Label>
                <Select
                  className='react-select'
                  classNamePrefix='select'
                  theme={selectThemeColors}
                  options={[{ value: null, label: 'My Mailbox' }, ...mailboxOptions]}
                  value={
                    [{ value: null, label: 'My Mailbox' }, ...mailboxOptions].find(o => o.value === viewingMailboxId) ||
                    null
                  }
                  onChange={onSelectMailbox}
                  menuPlacement='top'
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar