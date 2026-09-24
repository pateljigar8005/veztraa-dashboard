import { useState, useEffect, Fragment } from 'react'
import axios from 'axios'
import classnames from 'classnames'
import { Editor } from '@veztraa/editor'
import { X, Star, Trash, Clock, Send } from 'react-feather'
import Select, { components } from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { Modal, ModalBody, ModalFooter, Button, Form, Input, Label, FormFeedback } from 'reactstrap'
import Avatar from '@components/avatar'
import TaskAttachments from './TaskAttachments'
import DateField from '../shared/DateField'
import HistoryModal from '../activity-log/HistoryModal'
import useHolidayDates from '@hooks/useHolidayDates'
import useWeekendDays from '@hooks/useWeekendDays'
import { isObjEmpty, selectThemeColors, resolveAvatarUrl, uploadEditorImage } from '@utils'
import { priorityOptions, statusOptions } from './todoOptions'
import { fetchComments, addComment, deleteComment } from './store'
import { currentUserCan } from '@src/utility/navPermissions'
import '@styles/react/libs/react-select/_react-select.scss'

const defaultPriorityOption = priorityOptions.find(o => o.value === 'medium')
const defaultStatusOption = statusOptions.find(o => o.value === 'not_started')
const TODO_TASK_HISTORY_BTN = 'todo-task-history-btn'

const ModalHeader = props => {
  const { children, store, handleTaskSidebar, important, setImportant, deleteTask, dispatch } = props

  const handleDeleteTask = () => {
    dispatch(deleteTask(store.selectedTask.id))
    handleTaskSidebar()
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
  const [submittingComment, setSubmittingComment] = useState(false)
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
        response.data.data.users.map(u => ({
          value: u.id,
          label: u.fullName,
          img: resolveAvatarUrl(u.avatar)
        }))
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
      // Quick shortcut for the common case - the real, explicit control is
      // the Status field below, this just flips between Completed and
      // Not Started in one click without opening that dropdown.
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
    dispatch(selectTask({}))
    clearErrors()
  }

  const handleAddComment = () => {
    if (!commentText.trim() || isObjEmpty(store.selectedTask)) return
    setSubmittingComment(true)
    dispatch(addComment({ taskId: store.selectedTask.id, comment: commentText.trim() })).then(() => {
      setCommentText('')
      setSubmittingComment(false)
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
      centered
      size='xl'
      onOpened={handleSidebarOpened}
      onClosed={handleSidebarClosed}
    >
      <Form id='form-modal-todo' className='todo-modal' onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader store={store} dispatch={dispatch} important={important} deleteTask={deleteTask} setImportant={setImportant} handleTaskSidebar={handleTaskSidebar}>
          {handleSidebarTitle()}
        </ModalHeader>
        <ModalBody className='flex-grow-1' style={{ maxHeight: '65vh', overflowY: 'auto' }}>
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
                  <div className='d-flex align-items-start'>
                    <Avatar
                      initials
                      size='sm'
                      className='me-50'
                      color='light-primary'
                      content={c.user_name}
                      img={resolveAvatarUrl(c.user_avatar) || undefined}
                    />
                    <div>
                      <p className='mb-0'>
                        <span className='fw-bolder'>{c.user_name}</span>{' '}
                        <small className='text-muted'>{c.created_at?.slice(0, 16).replace('T', ' ')}</small>
                      </p>
                      <p className='mb-0'>{c.comment}</p>
                    </div>
                  </div>
                  {/* Same task-level access as the rest of this modal, not
                      per-comment authorship - anyone who can open this task
                      (admin or its assignee) can clear a comment on it,
                      matching TodoController::deleteComment()'s own check. */}
                  <X
                    size={14}
                    className='cursor-pointer text-muted mt-25'
                    onClick={() => dispatch(deleteComment({ id: c.id, taskId: store.selectedTask.id }))}
                  />
                </div>
              ))}
              <div className='d-flex align-items-start mt-1' style={{ gap: '0.5rem' }}>
                <Input
                  type='textarea'
                  rows='2'
                  placeholder='Write a comment...'
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
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