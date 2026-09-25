import { useState } from 'react'
import { Button, Input } from 'reactstrap'
import { Send } from 'react-feather'
import Avatar from '@components/avatar'
import { resolveAvatarUrl } from '@utils'

// Timestamped note log reused here for Contact Us/Job Application
// follow-up notes, so both places look and behave the same way.
const NotesSection = ({ notes, onAddNote, canAdd = true, submitting = false }) => {
  const [text, setText] = useState('')

  const handleAdd = () => {
    if (!text.trim() || submitting) return
    Promise.resolve(onAddNote(text.trim())).then(() => setText(''))
  }

  return (
    <div>
      {notes.length === 0 ? (
        <p className='text-muted mb-2'>No notes yet.</p>
      ) : (
        notes.map(n => (
          <div key={n.id} className='d-flex align-items-start mb-1'>
            <Avatar
              initials
              size='sm'
              className='me-50'
              color='light-primary'
              content={n.user_name}
              img={resolveAvatarUrl(n.user_avatar) || undefined}
            />
            <div>
              <p className='mb-0'>
                <span className='fw-bolder'>{n.user_name}</span>{' '}
                <small className='text-muted'>{n.created_at?.slice(0, 16).replace('T', ' ')}</small>
              </p>
              <p className='mb-0' style={{ whiteSpace: 'pre-wrap' }}>
                {n.note}
              </p>
            </div>
          </div>
        ))
      )}
      {canAdd && (
        <div className='d-flex align-items-start mt-1' style={{ gap: '0.5rem' }}>
          <Input type='textarea' rows='2' placeholder='Add a note...' value={text} onChange={e => setText(e.target.value)} />
          <Button type='button' color='primary' className='btn-icon' disabled={submitting || !text.trim()} onClick={handleAdd}>
            <Send size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}

export default NotesSection
