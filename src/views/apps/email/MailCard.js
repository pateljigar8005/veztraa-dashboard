import classnames from 'classnames'
import Avatar from '@components/avatar'
import { Input } from 'reactstrap'
import { Star, Paperclip } from 'react-feather'
import { formatRelativeDate, formatRecipients, initialsSource } from '@utils'

const MailCard = props => {
  const { mail, folder, handleMailClick, selected, onToggleSelect, onContextMenu, onToggleFlag, readOnly } = props

  const isScheduled = folder === 'Scheduled'
  const isSent = folder === 'Sent' || isScheduled
  const recipients = isSent ? formatRecipients(mail.to) : ''
  const displayName = isSent ? recipients || 'No recipients' : mail.from?.name || mail.from?.email || 'Unknown'

  return (
    <li
      onClick={() => handleMailClick(mail.uid)}
      onContextMenu={e => onContextMenu(e, mail)}
      className={classnames('d-flex user-mail', { 'mail-read': mail.isRead })}
    >
      <div className={classnames('mail-left pe-50 mail-select-toggle', { selected })}>
        <Avatar initials color='light-primary' content={initialsSource(displayName)} className='mail-avatar' />
        {
                                                   }
        <div className='form-check mail-select-checkbox rounded-circle bg-light-primary'>
          <Input
            type='checkbox'
            id={`mail-select-${mail.uid}`}
            checked={selected}
            onClick={e => e.stopPropagation()}
            onChange={() => onToggleSelect(mail.uid)}
          />
        </div>
      </div>
      <div className='mail-body'>
        <div className='mail-details'>
          <div className='mail-items'>
            <h5 className='mb-25'>
              {isSent && <span className='text-muted fw-normal'>To: </span>}
              {displayName}
            </h5>
            <div className='d-flex align-items-center' style={{ gap: '0.35rem', minWidth: 0 }}>
              <span className='text-truncate'>{mail.subject}</span>
              {mail.hasAttachments && <Paperclip size={13} className='text-muted flex-shrink-0' />}
            </div>
          </div>
          <div className='mail-meta-item' style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className='mail-date'>
              {isScheduled && <span className='text-muted'>Sends </span>}
              {mail.date ? formatRelativeDate(mail.date) : ''}
            </span>
            {
                                                                           }
            {!isScheduled && !readOnly && (
              <span
                className='mail-star-toggle mt-25'
                style={{ cursor: 'pointer', display: 'inline-flex' }}
                onClick={e => {
                  e.stopPropagation()
                  onToggleFlag(mail)
                }}
              >
                <Star
                  size={16}
                  className={mail.isFlagged ? 'text-warning' : 'text-muted'}
                  fill={mail.isFlagged ? 'currentColor' : 'none'}
                />
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export default MailCard