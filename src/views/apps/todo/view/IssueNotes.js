import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Button } from 'reactstrap'
import { Edit2, Trash2 } from 'react-feather'
import Avatar from '@components/avatar'
import { resolveAvatarUrl, getUserData } from '@utils'
import { confirmDelete } from '@src/utility/confirmDelete'
import { fetchComments, addComment, editComment, deleteComment } from '../store'
import { formatDateTime } from '../IssueBits'
import { MentionTextarea, renderCommentText } from './MentionTextarea'

const addMention = setter => id => setter(prev => (prev.includes(id) ? prev : [...prev, id]))

// Mantis "Notes" (bugnotes) - the issue's discussion thread with @mentions.
const IssueNotes = ({ issueId, userOptions }) => {
  const dispatch = useDispatch()
  const comments = useSelector(state => state.todo.comments)
  const currentUser = getUserData()
  const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin'
  const canModify = c => isAdmin || (currentUser && c.user_id === currentUser.id)

  const [text, setText] = useState('')
  const [mentionIds, setMentionIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editMentionIds, setEditMentionIds] = useState([])

  useEffect(() => {
    dispatch(fetchComments(issueId))
  }, [issueId])

  const handleAdd = () => {
    if (!text.trim()) return
    setSubmitting(true)
    dispatch(addComment({ taskId: issueId, comment: text.trim(), mentionedUserIds: mentionIds }))
      .unwrap()
      .then(() => {
        setText('')
        setMentionIds([])
      })
      .catch(() => toast.error('Failed to add note'))
      .finally(() => setSubmitting(false))
  }

  const handleSaveEdit = () => {
    if (!editText.trim()) return
    dispatch(editComment({ id: editingId, taskId: issueId, comment: editText.trim(), mentionedUserIds: editMentionIds }))
      .unwrap()
      .then(() => setEditingId(null))
      .catch(err => toast.error(err?.message || 'Failed to update note'))
  }

  const handleDelete = c =>
    confirmDelete({
      title: 'Delete this note?',
      text: "You won't be able to revert this!",
      onConfirm: () =>
        dispatch(deleteComment({ id: c.id, taskId: issueId }))
          .unwrap()
          .catch(err => toast.error(err?.message || 'Failed to delete'))
    })

  return (
    <Card>
      <CardHeader className='pb-50'>
        <CardTitle tag='h5' className='mb-0'>
          Notes ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardBody>
        {comments.length === 0 && <p className='text-muted'>There are no notes attached to this issue.</p>}
        {comments.map(c => (
          <div key={c.id} className='d-flex border rounded mb-1 overflow-hidden'>
            <div className='p-1 bg-light-secondary flex-shrink-0' style={{ width: 170 }}>
              <div className='d-flex align-items-center mb-25'>
                <Avatar
                  initials
                  size='sm'
                  className='me-50'
                  color='light-primary'
                  content={c.user_name}
                  img={resolveAvatarUrl(c.user_avatar) || undefined}
                />
                <span className='fw-bolder text-truncate'>{c.user_name}</span>
              </div>
              <small className='text-muted d-block'>{formatDateTime(c.created_at)}</small>
              {c.updated_at && <small className='text-muted d-block'>edited {formatDateTime(c.updated_at)}</small>}
              {canModify(c) && editingId !== c.id && (
                <div className='d-flex mt-50' style={{ gap: '0.75rem' }}>
                  <Edit2
                    size={14}
                    className='cursor-pointer text-muted'
                    onClick={() => {
                      setEditingId(c.id)
                      setEditText(c.comment)
                      setEditMentionIds((c.mentions || []).map(m => m.id).filter(Boolean))
                    }}
                  />
                  <Trash2 size={14} className='cursor-pointer text-muted' onClick={() => handleDelete(c)} />
                </div>
              )}
            </div>
            <div className='p-1 flex-grow-1' style={{ minWidth: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {editingId === c.id ? (
                <>
                  <MentionTextarea
                    value={editText}
                    onChange={setEditText}
                    onMention={addMention(setEditMentionIds)}
                    assigneeOptions={userOptions}
                    rows={3}
                  />
                  <div className='d-flex mt-50' style={{ gap: '0.5rem' }}>
                    <Button size='sm' color='primary' disabled={!editText.trim()} onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button size='sm' color='flat-secondary' onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                renderCommentText(c.comment, c.mentions)
              )}
            </div>
          </div>
        ))}

        <div className='mt-1'>
          <MentionTextarea
            id='issue-note-input'
            value={text}
            onChange={setText}
            onMention={addMention(setMentionIds)}
            assigneeOptions={userOptions}
            placeholder='Add a note... (type @ to mention someone)'
            rows={4}
          />
          <div className='d-flex justify-content-end mt-50'>
            <Button color='primary' size='sm' disabled={submitting || !text.trim()} onClick={handleAdd}>
              Add Note
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default IssueNotes
