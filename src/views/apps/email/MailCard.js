// ** Custom Components & Plugins
import classnames from 'classnames'

// ** Custom Component Import
import Avatar from '@components/avatar'

// ** Utils
import { formatDateToMonthShort } from '@utils'

const MailCard = props => {
  // ** Props
  const { mail, handleMailClick } = props

  const fromName = mail.from?.name || mail.from?.email || 'Unknown'

  return (
    <li onClick={() => handleMailClick(mail.uid)} className={classnames('d-flex user-mail', { 'mail-read': mail.isRead })}>
      <div className='mail-left pe-50'>
        <Avatar initials color='light-primary' content={fromName} />
      </div>
      <div className='mail-body'>
        <div className='mail-details'>
          <div className='mail-items'>
            <h5 className='mb-25'>{fromName}</h5>
            <span className='text-truncate'>{mail.subject}</span>
          </div>
          <div className='mail-meta-item'>
            <span className='mail-date'>{mail.date ? formatDateToMonthShort(mail.date) : ''}</span>
          </div>
        </div>
      </div>
    </li>
  )
}

export default MailCard
