import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select, { components } from 'react-select'
import { X, Trash2, Send } from 'react-feather'
import { useForm, Controller } from 'react-hook-form'
import { Modal, ModalBody, ModalFooter, Button, Form, Input, Label, FormFeedback } from 'reactstrap'
import { useDispatch, useSelector } from 'react-redux'
import { updateTask, deleteTask, fetchComments, addComment, handleSelectTask } from './store'
import { taskTypeOptions, priorityOptions } from './kanbanOptions'
import Avatar from '@components/avatar'
import TaskAttachments from './TaskAttachments'
import DateField from '../shared/DateField'
import useHolidayDates from '@hooks/useHolidayDates'
import useWeekendDays from '@hooks/useWeekendDays'
import { isObjEmpty, selectThemeColors, resolveAvatarUrl } from '@utils'
import { confirmDelete } from '@src/utility/confirmDelete'
import '@styles/react/libs/react-select/_react-select.scss'

const defaultValues = {
  title: ''
}

const TaskSidebar = props => {
  const { sidebarOpen, selectedTask, handleTaskSidebarToggle } = props

  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState('task')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const { holidayDates } = useHolidayDates()
  const { isWeekend } = useWeekendDays()
  const [assignees, setAssignees] = useState([])
  const [userOptions, setUserOptions] = useState([])
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const dispatch = useDispatch()
  const comments = useSelector(state => state.kanban.comments)
  const {
    control,
    setError,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  useEffect(() => {
    axios.get('/users', { params: { perPage: 100 } }).then(response => {
      setUserOptions(
        response.data.data.users
          .filter(u => u.is_active)
          .map(u => ({ value: u.id, label: u.fullName, avatar: resolveAvatarUrl(u.avatar) }))
      )
    })
  }, [])

  const handleSidebarOpened = () => {
    if (!isObjEmpty(selectedTask)) {
      setValue('title', selectedTask.title)
      setDescription(selectedTask.description || '')
      setTaskType(selectedTask.task_type || 'task')
      setPriority(selectedTask.priority || 'medium')
      setDueDate(selectedTask.due_date || '')
      setAssignees(
        (selectedTask.assignees || []).map(a => ({ value: a.id, label: a.name, avatar: resolveAvatarUrl(a.avatar) }))
      )
      dispatch(fetchComments(selectedTask.id))
    }
  }

  const handleSidebarClosed = () => {
    setDescription('')
    setTaskType('task')
    setPriority('medium')
    setDueDate('')
    setAssignees([])
    setCommentText('')
    setValue('title', '')
    clearErrors()
    dispatch(handleSelectTask({}))
  }

  const onSubmit = data => {
    if (data.title.length) {
      dispatch(
        updateTask({
          id: selectedTask.id,
          title: data.title,
          description,
          task_type: taskType,
          priority,
          due_date: dueDate || null,
          assignee_ids: assignees.map(a => a.value)
        })
      ).then(() => {
        toast.success('Task updated')
        handleTaskSidebarToggle()
      })
    } else {
      setError('title')
    }
  }

  const handleDeleteTask = () => {
    confirmDelete({
      text: `This will permanently delete the task "${selectedTask.title}".`,
      onConfirm: () =>
        dispatch(deleteTask(selectedTask.id)).then(() => {
          toast.success('Task deleted')
          handleTaskSidebarToggle()
        })
    })
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    setSubmittingComment(true)
    dispatch(addComment({ taskId: selectedTask.id, comment: commentText.trim() })).then(() => {
      setCommentText('')
      setSubmittingComment(false)
    })
  }

  const selectedTaskTypeOption = taskTypeOptions.find(i => i.value === taskType) || null
  const selectedPriorityOption = priorityOptions.find(i => i.value === priority) || null

  const AssigneeOption = ({ data, ...optionProps }) => (
    <components.Option {...optionProps} data={data}>
      <div className='d-flex align-items-center'>
        <Avatar initials size='sm' className='me-50' color='light-primary' content={data.label} img={data.avatar || undefined} />
        <span>{data.label}</span>
      </div>
    </components.Option>
  )

  return (
    <Modal
      isOpen={sidebarOpen}
      centered
      size='xl'
      onOpened={handleSidebarOpened}
      onClosed={handleSidebarClosed}
      toggle={handleTaskSidebarToggle}
    >
      <Form id='form-modal-kanban' onSubmit={handleSubmit(onSubmit)}>
        <div className='modal-header d-flex align-items-center justify-content-between'>
          <h5 className='modal-title'>Task Details</h5>
          <X className='fw-normal cursor-pointer' size={16} onClick={handleTaskSidebarToggle} />
        </div>
        <ModalBody style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className='mb-1'>
            <Label className='form-label' for='task-title'>
              Title <span className='text-danger'>*</span>
            </Label>
            <Controller
              name='title'
              control={control}
              render={({ field }) => (
                <Input id='task-title' placeholder='Title' invalid={errors.title && true} {...field} />
              )}
            />
            {errors.title && <FormFeedback>Please enter a valid task title</FormFeedback>}
          </div>

          <div className='mb-1 d-flex' style={{ gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <Label className='form-label' for='task-type'>
                Type
              </Label>
              <Select
                inputId='task-type'
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={taskTypeOptions}
                value={selectedTaskTypeOption}
                onChange={option => setTaskType(option ? option.value : 'task')}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label className='form-label' for='task-priority'>
                Priority
              </Label>
              <Select
                inputId='task-priority'
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={priorityOptions}
                value={selectedPriorityOption}
                onChange={option => setPriority(option ? option.value : 'medium')}
              />
            </div>
          </div>

          <div className='mb-1'>
            <Label className='form-label' for='task-assignee'>
              Assignees
            </Label>
            <Select
              isMulti
              inputId='task-assignee'
              isClearable
              value={assignees}
              className='react-select'
              classNamePrefix='select'
              options={userOptions}
              theme={selectThemeColors}
              onChange={options => setAssignees(options || [])}
              placeholder='Unassigned'
              components={{ Option: AssigneeOption }}
            />
          </div>

          <div className='mb-1'>
            <Label className='form-label' for='due-date'>
              Due Date
            </Label>
            <DateField
              id='due-date'
              value={dueDate}
              onChange={setDueDate}
              options={{ disable: [...holidayDates, isWeekend] }}
            />
          </div>

          <div className='mb-1'>
            <Label className='form-label' for='task-desc'>
              Description
            </Label>
            <Input
              type='textarea'
              value={description}
              id='task-desc'
              rows='3'
              placeholder='Description...'
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className='mb-1'>
            <Label className='form-label'>Attachments</Label>
            {selectedTask?.id ? (
              <TaskAttachments taskId={selectedTask.id} />
            ) : (
              <p className='text-muted small mb-0'>Save the task first to attach files.</p>
            )}
          </div>

          {selectedTask?.reporter_name && (
            <p className='text-muted small mb-2'>
              Reported by {selectedTask.reporter_name}
              {selectedTask.created_at ? ` on ${selectedTask.created_at.slice(0, 10)}` : ''}
            </p>
          )}

          {selectedTask?.id && (
            <div className='kanban-comments border-top pt-1'>
              <Label className='form-label'>Comments ({comments.length})</Label>
              {comments.map(c => (
                <div key={c.id} className='d-flex align-items-start mb-1'>
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
                  id='kanban-add-comment-btn'
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
        <ModalFooter>
          <Button type='submit' color='primary'>
            Save
          </Button>
          {selectedTask?.id && (
            <Button type='button' outline color='danger' onClick={handleDeleteTask}>
              <Trash2 size={14} className='me-50' />
              Delete
            </Button>
          )}
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default TaskSidebar