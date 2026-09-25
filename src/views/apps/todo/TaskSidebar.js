import { useState, useEffect, useRef, Fragment } from 'react'
import axios from 'axios'
import classnames from 'classnames'
import { Editor } from '@veztraa/editor'
import { X, Star, Trash, Clock, Send, Edit2, Check } from 'react-feather'
import Select, { components } from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { Modal, ModalBody, ModalFooter, Button, Form, Input, Label, FormFeedback } from 'reactstrap'
import Avatar from '@components/avatar'
import TaskAttachments from './TaskAttachments'
import DateField from '../shared/DateField'
import HistoryModal from '../activity-log/HistoryModal'
import useHolidayDates from '@hooks/useHolidayDates'
import useWeekendDays from '@hooks/useWeekendDays'
import { isObjEmpty, selectThemeColors, resolveAvatarUrl, uploadEditorImage, getUserData, sortOptions } from '@utils'
import { priorityOptions, statusOptions } from './todoOptions'
import { fetchComments, addComment, editComment, deleteComment } from './store'
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'
import '@styles/react/libs/react-select/_react-select.scss'

// Suggest task assignees while the user is typing an @mention.
const MentionTextarea = ({ id, value, onChange, onMention, assigneeOptions, placeholder, rows = 2 }) => {
  const textareaRef = useRef(null)
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionStart, setMentionStart] = useState(null)

  const handleChange = e => {
    const newValue = e.target.value
    const cursor = e.target.selectionStart
    onChange(newValue)

    const uptoCursor = newValue.slice(0, cursor)
    const at = uptoCursor.lastIndexOf('@')
    if (at === -1 || /\s/.test(uptoCursor.slice(at + 1))) {
      setMentionQuery(null)
      setMentionStart(null)
      return
    }
    setMentionQuery(uptoCursor.slice(at + 1))
    setMentionStart(at)
  }

  const filteredOptions =
    mentionQuery !== null
      ? assigneeOptions.filter(o => o.label.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
      : []

  const pickMention = option => {
    const textarea = textareaRef.current
    const cursor = textarea ? textarea.selectionStart : value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursor)
    const inserted = `@${option.label} `
    onChange(before + inserted + after)
    onMention(option.value)
    setMentionQuery(null)
    setMentionStart(null)
    requestAnimationFrame(() => {
      if (!textarea) return
      const pos = before.length + inserted.length
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className='position-relative flex-grow-1'>
      <Input
        id={id}
        innerRef={textareaRef}
        type='textarea'
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {mentionQuery !== null && filteredOptions.length > 0 && (
        <div
          className='mention-suggestions'
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            zIndex: 10,
            width: '100%',
            maxHeight: '10rem',
            overflowY: 'auto',
            background: 'var(--bs-body-bg, #fff)',
            border: '1px solid #d8d6de',
            borderRadius: '0.357rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          {filteredOptions.map(o => (
            <div
              key={o.value}
              className='d-flex align-items-center px-1 py-50'
              style={{ cursor: 'pointer' }}
              onMouseDown={e => {
                // Keep the textarea focused so the mention is inserted at the cursor.
                e.preventDefault()
                pickMention(o)
              }}
            >
              {o.img ? (
                <img className='d-block rounded-circle me-50' src={o.img} height='20' width='20' alt={o.label} />
              ) : (
                <Avatar initials size='sm' className='me-50' color='light-primary' content={o.label} />
              )}
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Highlight only mentions returned by the API.
const renderCommentText = (text, mentions) => {
  const names = (mentions || []).map(m => m.name).filter(Boolean).sort((a, b) => b.length - a.length)
  if (names.length === 0) {
    return text
  }

  const escaped = names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`@(${escaped.join('|')})\\b`, 'g')

  const parts = []
  let lastIndex = 0
  let match
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className='text-primary'>
        {match[0]}
      </strong>
    )
    lastIndex = match.index + match[0].length
  }
  parts.push(text.slice(lastIndex))
  return parts
}

const defaultPriorityOption = priorityOptions.find(o => o.value === 'medium')
const defaultStatusOption = statusOptions.find(o => o.value === 'not_started')
const TODO_TASK_HISTORY_BTN = 'todo-task-history-btn'

const ModalHeader = props => {
  const { children, store, handleTaskSidebar, important, setImportant, deleteTask, dispatch } = props

  const handleDeleteTask = () => {
    confirmDelete({
      title: `Delete "${store.selectedTask.title}"?`,
      text: "You won't be able to revert this!",
      onConfirm: () => {
        dispatch(deleteTask(store.selectedTask.id))
        handleTaskSidebar()
      }
    })
  }

  return (
    <div className='modal-header d-flex align-items-center justify-content-between'>
      <h5 className='modal-title'>{children}</h5>
      <div className='todo-item-action d-flex align-items-center'>
        {store && !isObjEmpty(store.selectedTask) ? (
          <Trash className='cursor-pointer mt-25' size={16} onClick={() => handleDeleteTask()} />
        ) : null}
        <span className='todo-item-favorite cursor-pointer mx-75'>
          <Star
            size={16}
            onClick={() => setImportant(!important)}
            className={classnames({
              'text-warning': important === true
            })}
          />
        </span>
        <X className='fw-normal mt-25' size={16} onClick={handleTaskSidebar} />
      </div>
    </div>
  )
}

const TaskSidebar = props => {
  const { open, handleTaskSidebar, store, dispatch, updateTask, selectTask, addTask, deleteTask } = props

  const [assigneeOptions, setAssigneeOptions] = useState([])
  const [assignees, setAssignees] = useState([])
  const [priority, setPriority] = useState(defaultPriorityOption)
  const [status, setStatus] = useState(defaultStatusOption)
  const [desc, setDesc] = useState('')
  const [important, setImportant] = useState(false)
  const [dueDate, setDueDate] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [commentMentionIds, setCommentMentionIds] = useState([])
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editMentionIds, setEditMentionIds] = useState([])
  const [savingEdit, setSavingEdit] = useState(false)
  const currentUser = getUserData()
  const isAdmin = (currentUser?.role || '').toLowerCase() === 'admin'
  const canModifyComment = c => isAdmin || (currentUser && c.user_id === currentUser.id)
  const { holidayDates } = useHolidayDates()
  const { isWeekend } = useWeekendDays()

  const {
    control,
    setError,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: { title: '' }
  })

  useEffect(() => {
    axios.get('/users', { params: { perPage: 100 } }).then(response => {
      setAssigneeOptions(
        sortOptions(
          response.data.data.users.map(u => ({
            value: u.id,
            label: u.fullName,
            img: resolveAvatarUrl(u.avatar)
          }))
        )
      )
    })
  }, [])

  const AssigneeComponent = ({ data, ...props }) => {
    return (
      <components.Option {...props}>
        <div className='d-flex align-items-center'>
          {data.img ? (
            <img className='d-block rounded-circle me-50' src={data.img} height='26' width='26' alt={data.label} />
          ) : (
            <Avatar initials className='me-50' size='sm' color='light-primary' content={data.label} />
          )}
          <p className='mb-0'>{data.label}</p>
        </div>
      </components.Option>
    )
  }

  const handleSidebarTitle = () => {
    if (store && !isObjEmpty(store.selectedTask)) {
      // Toggle the common completed/not-started transition from the header.
      const isCompleted = status?.value === 'completed'
      return (
        <Button
          outline
          size='sm'
          onClick={() => setStatus(statusOptions.find(o => o.value === (isCompleted ? 'not_started' : 'completed')))}
          color={isCompleted ? 'success' : 'secondary'}
        >
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </Button>
      )
    } else {
      return 'Add Task'
    }
  }

  const handleSidebarOpened = () => {
    const { selectedTask } = store
    if (!isObjEmpty(selectedTask)) {
      setValue('title', selectedTask.title)
      setImportant(selectedTask.isImportant)
      setAssignees(
        (selectedTask.assignees || []).map(a => ({
          value: a.id,
          label: a.fullName,
          img: resolveAvatarUrl(a.avatar)
        }))
      )
      setDueDate(selectedTask.dueDate || null)
      setDesc(typeof selectedTask.description === 'string' ? selectedTask.description : '')
      setPriority(priorityOptions.find(o => o.value === selectedTask.priority) || defaultPriorityOption)
      setStatus(statusOptions.find(o => o.value === selectedTask.status) || defaultStatusOption)
      dispatch(fetchComments(selectedTask.id))
    }
  }

  const handleSidebarClosed = () => {
    setPriority(defaultPriorityOption)
    setStatus(defaultStatusOption)
    setDesc('')
    setValue('title', '')
    setAssignees([])
    setImportant(false)
    setDueDate(null)
    setCommentText('')
    setCommentMentionIds([])
    setEditingCommentId(null)
    dispatch(selectTask({}))
    clearErrors()
  }

  const handleAddComment = () => {
    if (!commentText.trim() || isObjEmpty(store.selectedTask)) return
    setSubmittingComment(true)
    dispatch(addComment({ taskId: store.selectedTask.id, comment: commentText.trim(), mentionedUserIds: commentMentionIds })).then(() => {
      setCommentText('')
      setCommentMentionIds([])
      setSubmittingComment(false)
    })
  }

  const handleStartEditComment = c => {
    setEditingCommentId(c.id)
    setEditText(c.comment)
    setEditMentionIds((c.mentions || []).map(m => m.id))
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditText('')
    setEditMentionIds([])
  }

  const handleSaveEditComment = () => {
    if (!editText.trim()) return
    setSavingEdit(true)
    dispatch(
      editComment({
        id: editingCommentId,
        taskId: store.selectedTask.id,
        comment: editText.trim(),
        mentionedUserIds: editMentionIds
      })
    )
      .unwrap()
      .then(() => {
        setSavingEdit(false)
        handleCancelEditComment()
      })
      .catch(() => setSavingEdit(false))
  }

  const handleDeleteComment = c => {
    confirmDelete({
      text: "You won't be able to revert this!",
      onConfirm: () => dispatch(deleteComment({ id: c.id, taskId: store.selectedTask.id }))
    })
  }

  const canViewHistory = currentUserCan('/activity-log', 'view')

  const renderFooterButtons = () => {
    if (store && !isObjEmpty(store.selectedTask)) {
      return (
        <Button color='primary' className='update-btn update-todo-item'>
          Update
        </Button>
      )
    } else {
      return (
        <Fragment>
          <Button color='primary' className='add-todo-item me-1'>
            Add
          </Button>
          <Button color='secondary' onClick={handleTaskSidebar} outline>
            Cancel
          </Button>
        </Fragment>
      )
    }
  }

  const onSubmit = data => {
    if (!data.title.length) {
      setError('title', { type: 'manual' })
      return
    }

    const payload = {
      title: data.title,
      description: desc,
      due_date: dueDate,
      priority: priority ? priority.value : 'medium',
      status: status ? status.value : 'not_started',
      assignee_ids: assignees.map(a => a.value),
      is_important: important
    }

    if (isObjEmpty(store.selectedTask)) {
      dispatch(addTask(payload))
    } else {
      dispatch(updateTask({ id: store.selectedTask.id, ...payload }))
    }
    handleTaskSidebar()
  }

  return (
    <Modal
      isOpen={open}
      toggle={handleTaskSidebar}
      modalClassName='modal-slide-in'
      contentClassName='overflow-hidden'
      className='sidebar-half'
      onOpened={handleSidebarOpened}
      onClosed={handleSidebarClosed}
    >
      <Form
        id='form-modal-todo'
        className='todo-modal d-flex flex-column'
        style={{ height: '100%' }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <ModalHeader store={store} dispatch={dispatch} important={important} deleteTask={deleteTask} setImportant={setImportant} handleTaskSidebar={handleTaskSidebar}>
          {handleSidebarTitle()}
        </ModalHeader>
        <ModalBody className='flex-grow-1' style={{ overflowY: 'auto' }}>
          <div className='mb-1'>
            <Label className='form-label' for='task-title'>
              Title <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='title'
              control={control}
              render={({ field }) => (
                <Input
                  id='task-title'
                  placeholder='Title'
                  className='new-todo-item-title'
                  invalid={errors.title && true}
                  {...field}
                />
              )}
            />
            {errors.title && <FormFeedback>Please enter a valid task title</FormFeedback>}
          </div>
          <div className='mb-1'>
            <Label className='form-label' for='task-assignee'>
              Assignees
            </Label>
            <Select
              isMulti
              id='task-assignee'
              className='react-select'
              classNamePrefix='select'
              isClearable
              options={assigneeOptions}
              theme={selectThemeColors}
              value={assignees}
              onChange={data => setAssignees(data || [])}
              components={{ Option: AssigneeComponent }}
              placeholder='Unassigned'
            />
          </div>
          <div className='mb-1'>
            <Label className='form-label' for='due-date'>
              Due Date
            </Label>
            <DateField
              id='due-date'
              name='due-date'
              value={dueDate}
              onChange={setDueDate}
              options={{ disable: [...holidayDates, isWeekend] }}
            />
          </div>
          <div className='mb-1 d-flex' style={{ gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Label className='form-label' for='task-status'>
                Status
              </Label>
              <Select
                id='task-status'
                className='react-select'
                classNamePrefix='select'
                isClearable={false}
                options={statusOptions}
                theme={selectThemeColors}
                value={status}
                onChange={data => setStatus(data)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label className='form-label' for='task-priority'>
                Priority
              </Label>
              <Select
                id='task-priority'
                className='react-select'
                classNamePrefix='select'
                isClearable={false}
                options={priorityOptions}
                theme={selectThemeColors}
                value={priority}
                onChange={data => setPriority(data)}
              />
            </div>
          </div>
          <div className='mb-1'>
            <Label for='task-desc' className='form-label'>
              Description
            </Label>
            <Editor value={desc} onChange={setDesc} height={300} onImageUpload={uploadEditorImage} />
          </div>
          <div className='mb-1'>
            <Label className='form-label'>Attachments</Label>
            {store && !isObjEmpty(store.selectedTask) ? (
              <TaskAttachments taskId={store.selectedTask.id} />
            ) : (
              <p className='text-muted small mb-0'>Save the task first to attach files.</p>
            )}
          </div>

          {/* Only once the task is saved (real id, real thread to post to) -
              same reasoning as Attachments right above. */}
          {store && !isObjEmpty(store.selectedTask) && (
            <div className='todo-comments border-top pt-1'>
              <Label className='form-label'>Comments ({store.comments.length})</Label>
              {store.comments.map(c => (
                <div key={c.id} className='d-flex align-items-start justify-content-between mb-1'>
                  <div className='d-flex align-items-start flex-grow-1' style={{ minWidth: 0 }}>
                    <Avatar
                      initials
                      size='sm'
                      className='me-50'
                      color='light-primary'
                      content={c.user_name}
                      img={resolveAvatarUrl(c.user_avatar) || undefined}
                    />
                    {editingCommentId === c.id ? (
                      <div className='flex-grow-1'>
                        <MentionTextarea
                          value={editText}
                          onChange={setEditText}
                          onMention={id => setEditMentionIds(prev => (prev.includes(id) ? prev : [...prev, id]))}
                          assigneeOptions={assigneeOptions}
                          rows={2}
                        />
                        <div className='mt-50' style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            type='button'
                            size='sm'
                            color='primary'
                            disabled={savingEdit || !editText.trim()}
                            onClick={handleSaveEditComment}
                          >
                            <Check size={14} className='me-25' /> Save
                          </Button>
                          <Button type='button' size='sm' color='flat-secondary' onClick={handleCancelEditComment}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ minWidth: 0 }}>
                        <p className='mb-0'>
                          <span className='fw-bolder'>{c.user_name}</span>{' '}
                          <small className='text-muted'>{c.created_at?.slice(0, 16).replace('T', ' ')}</small>
                          {c.updated_at && <small className='text-muted'> (edited)</small>}
                        </p>
                        <p className='mb-0'>{renderCommentText(c.comment, c.mentions)}</p>
                      </div>
                    )}
                  </div>
                  {/* Author (or admin) only, matching TodoController's
                      updateComment()/deleteComment() ownership check - a
                      task's other assignees can read the thread but not
                      touch someone else's comment. */}
                  {editingCommentId !== c.id && canModifyComment(c) && (
                    <div className='d-flex align-items-center flex-shrink-0' style={{ gap: '0.5rem' }}>
                      <Edit2
                        size={14}
                        className='cursor-pointer text-muted mt-25'
                        onClick={() => handleStartEditComment(c)}
                      />
                      <X
                        size={14}
                        className='cursor-pointer text-muted mt-25'
                        onClick={() => handleDeleteComment(c)}
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className='d-flex align-items-start mt-1' style={{ gap: '0.5rem' }}>
                <MentionTextarea
                  id='todo-comment-input'
                  value={commentText}
                  onChange={setCommentText}
                  onMention={id => setCommentMentionIds(prev => (prev.includes(id) ? prev : [...prev, id]))}
                  assigneeOptions={assigneeOptions}
                  placeholder='Write a comment... (type @ to mention someone)'
                  rows={2}
                />
                <Button
                  type='button'
                  id='todo-add-comment-btn'
                  color='primary'
                  className='btn-icon'
                  disabled={submittingComment || !commentText.trim()}
                  onClick={handleAddComment}
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className='d-flex justify-content-between'>
          <div>
            {store && !isObjEmpty(store.selectedTask) && canViewHistory && (
              <Button
                type='button'
                outline
                color='secondary'
                onClick={() => document.getElementById(TODO_TASK_HISTORY_BTN)?.click()}
              >
                <Clock size={14} className='me-50' />
                History
              </Button>
            )}
          </div>
          <div>{renderFooterButtons()}</div>
        </ModalFooter>
      </Form>
      {store && !isObjEmpty(store.selectedTask) && (
        <HistoryModal
          entityType='todo'
          entityId={store.selectedTask.id}
          entityLabel={store.selectedTask.title}
          buttonId={TODO_TASK_HISTORY_BTN}
        />
      )}
    </Modal>
  )
}

export default TaskSidebar