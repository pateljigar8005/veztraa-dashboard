// ** React Imports
import { useState, useEffect, Fragment } from 'react'

// ** Third Party Components
import axios from 'axios'
import classnames from 'classnames'
import { Editor } from '@veztraa/editor'
import { X, Star, Trash } from 'react-feather'
import Select, { components } from 'react-select' //eslint-disable-line
import { useForm, Controller } from 'react-hook-form'

// ** Reactstrap Imports
import { Modal, ModalBody, ModalFooter, Button, Form, Input, Label, FormFeedback } from 'reactstrap'

// ** Custom Components
import Avatar from '@components/avatar'
import TaskAttachments from './TaskAttachments'
import DateField from '../shared/DateField'

// ** Utils
import { isObjEmpty, selectThemeColors, resolveAvatarUrl, uploadEditorImage } from '@utils'

// ** Styles Imports
import '@styles/react/libs/react-select/_react-select.scss'

// ** Function to capitalize the first letter of string
const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1)

// ** Modal Header
const ModalHeader = props => {
  // ** Props
  const { children, store, handleTaskSidebar, important, setImportant, deleteTask, dispatch } = props

  // ** Function to delete task
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
  // ** Props
  const { open, handleTaskSidebar, store, dispatch, updateTask, selectTask, addTask, deleteTask } = props

  // ** States
  const [assigneeOptions, setAssigneeOptions] = useState([])
  const [assignee, setAssignee] = useState(null)
  const [tags, setTags] = useState([])
  const [desc, setDesc] = useState('')
  const [completed, setCompleted] = useState(false)
  const [important, setImportant] = useState(false)
  const [dueDate, setDueDate] = useState(null)

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

  // ** Real users for the Assignee select, instead of the old hardcoded demo list
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

  // ** Tag Select Options
  const tagOptions = [
    { value: 'team', label: 'Team' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'update', label: 'Update' }
  ]

  // ** Custom Assignee Component
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

  // ** Returns sidebar title
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

  // ** Function to run when sidebar opens
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

      if (selectedTask.tags.length) {
        const tags = []
        selectedTask.tags.map(tag => {
          tags.push({ value: tag, label: capitalize(tag) })
        })
        setTags(tags)
      }
    }
  }

  // ** Function to run when sidebar closes
  const handleSidebarClosed = () => {
    setTags([])
    setDesc('')
    setValue('title', '')
    setAssignee(null)
    setCompleted(false)
    setImportant(false)
    setDueDate(null)
    dispatch(selectTask({}))
    clearErrors()
  }

  // ** Renders Footer Buttons
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
      tags: tags.map(tag => tag.value),
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
            <DateField id='due-date' name='due-date' value={dueDate} onChange={setDueDate} />
          </div>
          <div className='mb-1'>
            <Label className='form-label' for='task-tags'>
              Tags
            </Label>
            <Select
              isMulti
              id='task-tags'
              className='react-select'
              classNamePrefix='select'
              isClearable={false}
              options={tagOptions}
              theme={selectThemeColors}
              value={tags}
              onChange={data => {
                setTags(data !== null ? [...data] : [])
              }}
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
