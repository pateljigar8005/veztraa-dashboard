// ** React Imports
import { Link } from 'react-router-dom'

// ** Third Party Components
import classnames from 'classnames'
import Select from 'react-select'
import PerfectScrollbar from 'react-perfect-scrollbar'
import { Mail, Send, Edit2, Trash, AlertTriangle, Archive, Clock } from 'react-feather'

// ** Reactstrap Imports
import { Button, ListGroup, ListGroupItem, Badge, Label } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

// ** Mirrors the backend's Mailbox::FOLDERS exactly (key = real IMAP folder
// name, label = what's shown) - the set of folders is fixed, never changes
// at runtime, so the sidebar renders this immediately instead of waiting on
// the first /mailbox/folders response just to know what folders exist. Only
// each folder's unreadCount badge actually depends on that response.
// 'Scheduled' is the one exception - not a real IMAP folder at all, just
// this user's own still-pending Schedule Send queue (see MailboxOutbox's
// listScheduled()/MailboxController's isScheduledFolder() special-casing) -
// included here anyway since it needs the exact same folder-switch/list/
// detail UI everything else already has.
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
  // ** Props
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
                {/* 'Scheduled' isn't a real IMAP folder at all (see FOLDERS'
                    own note above) - AdminMailboxController's guardFolder()
                    only recognizes Mailbox::FOLDERS' real set, so it 404s if
                    picked while browsing an admin mailbox. Hidden there
                    instead of left as a dead end. */}
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
            {/* Admin-only "browse as" picker (see AdminMailboxController) -
                lets an admin view one of the Admin Emails mailboxes (see
                Company Settings > Admin Emails) without needing that
                mailbox's own separate login. Read-only: see Mails.js/
                MailDetails.js/MailCard.js's own viewingMailboxId checks for
                what's hidden while one is selected. A sibling AFTER
                PerfectScrollbar, not inside it, so it isn't scrolled away
                with the folder list - sized as a real flex footer via the
                .email-app-mailbox-picker class (see app-email.scss's own
                note on why the base CSS's sizing here isn't reliable
                enough to lean on as-is). */}
            {isAdmin && (
              <div className='email-app-mailbox-picker px-1 pb-1 pt-50'>
                <Label className='form-label small text-muted mb-50'>Browse Mailbox</Label>
                <Select
                  className='react-select'
                  classNamePrefix='select'
                  theme={selectThemeColors}
                  // 'My Mailbox' is a real, always-first option here (value
                  // null) rather than just an empty/placeholder state - a
                  // deliberate choice so switching back is as explicit and
                  // discoverable a click as switching to any other mailbox,
                  // not a separate, easy-to-miss clear (x) button.
                  options={[{ value: null, label: 'My Mailbox' }, ...mailboxOptions]}
                  value={
                    [{ value: null, label: 'My Mailbox' }, ...mailboxOptions].find(o => o.value === viewingMailboxId) ||
                    null
                  }
                  onChange={onSelectMailbox}
                  // This control sits at the very bottom of the sidebar -
                  // opening the options list downward (react-select's
                  // default) pushes most of it below the viewport, same
                  // issue Schedule Send's own date picker had (see
                  // ComposePopup.js) - 'top' opens it upward instead, where
                  // there's actually room.
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
