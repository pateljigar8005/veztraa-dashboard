import { useState, useEffect, Fragment } from 'react'
import axios from 'axios'
import classnames from 'classnames'
import { Editor } from '@veztraa/editor'
import { X, Star, Trash } from 'react-feather'
import Select, { components } from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { Modal, ModalBody, ModalFooter, Button, Form, Input, Label, FormFeedback } from 'reactstrap'
import Avatar from '@components/avatar'
import TaskAttachments from './TaskAttachments'
import DateField from '../shared/DateField'
import useHolidayDates from '@hooks/useHolidayDates'
import useWeekendDays from '@hooks/useWeekendDays'
import { isObjEmpty, selectThemeColors, resolveAvatarUrl, uploadEditorImage } from '@utils'
import { priorityOptions } from '../kanban/kanbanOptions'
import '@styles/react/libs/react-select/_react-select.scss'

const defaultPriorityOption = priorityOptions.find(o => o.value === 'medium')

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
  const [assignee, setAssignee] = useState(null)
  const [priority, setPriority] = useState(defaultPriorityOption)
  const [desc, setDesc] = useState('')
  const [completed, setCompleted] = useState(false)
  const [important, setImportant] = useState(false)
  const [dueDate, setDueDate] = useState(null)
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
      return (
        <Button
          outline
          size='sm'
          onClick={() => setCompleted(!completed)}
          color={completed === true ? 'success' : 'secondary'}
        >
          {completed === true ? 'Completed' : 'Mark Complete'}
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
      setCompleted(selectedTask.isCompleted)
      setImportant(selectedTask.isImportant)
      setAssignee(
        selectedTask.assignee
          ? {
            value: selectedTask.assignee.id,
            label: selectedTask.assignee.fullName,
            img: resolveAvatarUrl(selectedTask.assignee.avatar)
          }
          : null
      )
      setDueDate(selectedTask.dueDate || null)
      setDesc(typeof selectedTask.description === 'string' ? selectedTask.description : '')
      setPriority(priorityOptions.find(o => o.value === selectedTask.priority) || defaultPriorityOption)
    }
  }

  const handleSidebarClosed = () => {
    setPriority(defaultPriorityOption)
    setDesc('')
    setValue('title', '')
    setAssignee(null)
    setCompleted(false)
    setImportant(false)
    setDueDate(null)
    dispatch(selectTask({}))
    clearErrors()
  }

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
      assigned_to: assignee ? assignee.value : null,
      is_completed: completed,
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
              Assignee
            </Label>
            <Select
              id='task-assignee'
              className='react-select'
              classNamePrefix='select'
              isClearable
              options={assigneeOptions}
              theme={selectThemeColors}
              value={assignee}
              onChange={data => setAssignee(data)}
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
          <div className='mb-1'>
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
          <div className='mb-1'>
            <Label for='task-desc' className='form-label'>
              Description
            </Label>
            <Editor value={desc} onChange={setDesc} height={300} onImageUpload={uploadEditorImage} />
          </div>
          <div>
            <Label className='form-label'>Attachments</Label>
            {store && !isObjEmpty(store.selectedTask) ? (
              <TaskAttachments taskId={store.selectedTask.id} />
            ) : (
              <p className='text-muted small mb-0'>Save the task first to attach files.</p>
            )}
          </div>
        </ModalBody>
        <ModalFooter>{renderFooterButtons()}</ModalFooter>
      </Form>
    </Modal>
  )
}

export default TaskSidebar