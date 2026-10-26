import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable'
import { Editor } from '@veztraa/editor'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormFeedback } from 'reactstrap'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import useHolidayDates from '@hooks/useHolidayDates'
import useWeekendDays from '@hooks/useWeekendDays'
import { selectThemeColors, uploadEditorImage } from '@utils'
import DateField from '../../shared/DateField'
import AttachmentsField from '../../shared/AttachmentsField'
import { addIssue, updateIssue, getIssue } from '../store'
import { fetchUserOptions, fetchProjectOptions, assigneeOptionsFor } from '../pickerOptions'
import { PriorityBadge, SeverityBadge, StatusOptionLabel } from '../IssueBits'
import { userSelectComponents } from '../userSelectParts'
import { uploadInChunks } from '../attachmentFiles'
import {
  categoryOptions,
  reproducibilityOptions,
  severityOptions,
  priorityOptions,
  statusOptions,
  resolutionOptions,
  platformOptions,
  osOptions,
  issueNumber
} from '../todoOptions'
import '@styles/react/libs/react-select/_react-select.scss'

const defaultValues = {
  title: '',
  steps_to_reproduce: '',
  additional_info: '',
  platform: '',
  os: '',
  os_build: '',
  product_version: '',
  target_version: '',
  fixed_in_version: '',
  due_date: ''
}

// Mantis's "Report Issue" defaults.
const defaultSelects = {
  project_id: null,
  assignee_ids: [],
  category: 'general',
  reproducibility: 'have_not_tried',
  severity: 'minor',
  priority: 'normal',
  status: 'new',
  resolution: 'open'
}

const FieldLabel = ({ htmlFor, children, required }) => (
  <Label className='form-label' for={htmlFor}>
    {children} {required && <span className='text-danger'>*</span>}
  </Label>
)

const IssueForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [userOptions, setUserOptions] = useState([])
  const [projectOptions, setProjectOptions] = useState([])
  const [selects, setSelects] = useState(defaultSelects)
  const [description, setDescription] = useState('')
  const [pendingFiles, setPendingFiles] = useState([])
  const [loaded, setLoaded] = useState(!isEdit)
  const { holidayDates } = useHolidayDates()
  const { isWeekend } = useWeekendDays()

  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty)

  const setSelect = (name, value) =>
    setSelects(prev => {
      const next = { ...prev, [name]: value }
      // Switching project drops assignees who aren't on the new one.
      if (name === 'project_id') {
        const project = projectOptions.find(p => p.value === value)
        if (project?.memberIds?.length) next.assignee_ids = prev.assignee_ids.filter(id => project.memberIds.includes(id))
      }
      return next
    })

  const selectedProject = projectOptions.find(p => p.value === selects.project_id)
  const assigneeOptions = assigneeOptionsFor(userOptions, selectedProject, selects.assignee_ids)

  useEffect(() => {
    fetchUserOptions().then(setUserOptions)
    fetchProjectOptions().then(setProjectOptions)
  }, [])

  // Edit loads the issue into the form.
  useEffect(() => {
    if (!id) return
    dispatch(getIssue(id))
      .unwrap()
      .then(issue => {
        reset({
          title: issue.title || '',
          steps_to_reproduce: issue.steps_to_reproduce || '',
          additional_info: issue.additional_info || '',
          platform: issue.platform || '',
          os: issue.os || '',
          os_build: issue.os_build || '',
          product_version: issue.product_version || '',
          target_version: issue.target_version || '',
          fixed_in_version: isEdit ? issue.fixed_in_version || '' : '',
          due_date: issue.due_date || ''
        })
        setSelects({
          project_id: issue.project_id,
          assignee_ids: issue.assignees.map(a => a.id),
          category: issue.category,
          reproducibility: issue.reproducibility,
          severity: issue.severity,
          priority: issue.priority,
          status: isEdit ? issue.status : 'new',
          resolution: isEdit ? issue.resolution : 'open'
        })
        setDescription(issue.description || '')
        setLoaded(true)
      })
      .catch(() => {
        toast.error('That issue no longer exists or you no longer have access to it')
        navigate('/todo')
      })
  }, [id])

  const uploadPendingFiles = async issueId => {
    for (const file of pendingFiles) {
      try {
        await uploadInChunks(issueId, file)
      } catch (err) {
        toast.error(err?.response?.data?.message || `Failed to upload "${file.name}"`)
      }
    }
  }

  const onSubmit = async data => {
    const payload = {
      ...data,
      ...selects,
      description,
      due_date: data.due_date || null
    }
    if (!isEdit) {
      // A new report always starts open; Mantis moves it to "assigned" when
      // it has an assignee (done server-side).
      delete payload.status
      delete payload.resolution
      delete payload.fixed_in_version
    }

    try {
      if (isEdit) {
        await dispatch(updateIssue({ id: Number(id), ...payload })).unwrap()
        toast.success('Issue updated')
        navigate(`/todo/view/${id}`)
      } else {
        const issue = await dispatch(addIssue(payload)).unwrap()
        await uploadPendingFiles(issue.id)
        toast.success(`Issue ${issueNumber(issue.id)} reported`)
        navigate(`/todo/view/${issue.id}`)
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save issue')
    }
  }

  const renderSelect = (name, options, { isClearable = false, placeholder, optionComponent, formatOptionLabel } = {}) => (
    <Select
      inputId={name}
      isClearable={isClearable}
      classNamePrefix='select'
      className='react-select'
      theme={selectThemeColors}
      options={options}
      value={options.find(o => o.value === selects[name]) || null}
      onChange={option => setSelect(name, option ? option.value : null)}
      placeholder={placeholder}
      components={optionComponent ? { Option: optionComponent } : undefined}
      formatOptionLabel={formatOptionLabel}
    />
  )

  // Pick from the common ones or type your own.
  const creatableField = (name, label, options) => (
    <Col md={4} className='mb-1'>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <CreatableSelect
            inputId={name}
            isClearable
            classNamePrefix='select'
            className='react-select'
            theme={selectThemeColors}
            options={options}
            value={field.value ? options.find(o => o.value === field.value) || { value: field.value, label: field.value } : null}
            onChange={option => field.onChange(option ? option.value : '')}
            formatCreateLabel={input => `Use "${input}"`}
            placeholder='Select or type...'
          />
        )}
      />
    </Col>
  )

  const textField = (name, label, props = {}) => (
    <Col md={4} className='mb-1'>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Controller name={name} control={control} render={({ field }) => <Input id={name} {...props} {...field} />} />
    </Col>
  )

  const title = isEdit ? `Edit Issue ${issueNumber(id)}` : 'Report Issue'

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>{title}</CardTitle>
        </CardHeader>
        <CardBody>
          {!loaded ? (
            <p className='text-muted mb-0'>Loading...</p>
          ) : (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Row>
                <Col md={4} className='mb-1'>
                  <FieldLabel htmlFor='project_id'>Project</FieldLabel>
                  {/* Finished projects can't take new issues, but an issue
                      already on one keeps showing it. */}
                  {renderSelect(
                    'project_id',
                    projectOptions.filter(p => !['completed', 'cancelled'].includes(p.status) || p.value === selects.project_id),
                    { isClearable: true, placeholder: 'No project' }
                  )}
                </Col>
                <Col md={4} className='mb-1'>
                  <FieldLabel htmlFor='category' required>
                    Category
                  </FieldLabel>
                  {renderSelect('category', categoryOptions)}
                </Col>
                <Col md={4} className='mb-1'>
                  <FieldLabel htmlFor='assignee_ids'>Assign To</FieldLabel>
                  <Select
                    inputId='assignee_ids'
                    isMulti
                    classNamePrefix='select'
                    className='react-select'
                    theme={selectThemeColors}
                    options={assigneeOptions}
                    value={userOptions.filter(o => selects.assignee_ids.includes(o.value))}
                    onChange={picked => setSelect('assignee_ids', (picked || []).map(o => o.value))}
                    placeholder='Unassigned'
                    components={userSelectComponents}
                  />
                  {selectedProject && (
                    <small className='text-muted'>
                      {selectedProject.memberIds.length
                        ? `Showing members of ${selectedProject.label}.`
                        : `${selectedProject.label} has no members yet - showing everyone.`}
                    </small>
                  )}
                </Col>
                <Col md={4} className='mb-1'>
                  <FieldLabel htmlFor='reproducibility'>Reproducibility</FieldLabel>
                  {renderSelect('reproducibility', reproducibilityOptions)}
                </Col>
                <Col md={4} className='mb-1'>
                  <FieldLabel htmlFor='severity'>Severity</FieldLabel>
                  {renderSelect('severity', severityOptions, { formatOptionLabel: o => <SeverityBadge severity={o.value} /> })}
                </Col>
                <Col md={4} className='mb-1'>
                  <FieldLabel htmlFor='priority'>Priority</FieldLabel>
                  {renderSelect('priority', priorityOptions, { formatOptionLabel: o => <PriorityBadge priority={o.value} /> })}
                </Col>
                {isEdit && (
                  <Fragment>
                    <Col md={4} className='mb-1'>
                      <FieldLabel htmlFor='status'>Status</FieldLabel>
                      {renderSelect('status', statusOptions, { formatOptionLabel: o => <StatusOptionLabel status={o.value} /> })}
                    </Col>
                    <Col md={4} className='mb-1'>
                      <FieldLabel htmlFor='resolution'>Resolution</FieldLabel>
                      {renderSelect('resolution', resolutionOptions)}
                    </Col>
                  </Fragment>
                )}
                <Col md={4} className='mb-1'>
                  <FieldLabel htmlFor='due_date'>Due Date</FieldLabel>
                  <Controller
                    name='due_date'
                    control={control}
                    render={({ field }) => (
                      // Public holidays and weekends can't be picked as a due date.
                      <DateField
                        id='due_date'
                        value={field.value}
                        onChange={field.onChange}
                        options={{ disable: [...holidayDates, isWeekend] }}
                      />
                    )}
                  />
                </Col>

                <Col md={12} className='mb-1'>
                  <FieldLabel htmlFor='title' required>
                    Summary
                  </FieldLabel>
                  <Controller
                    name='title'
                    control={control}
                    rules={{ validate: value => value.trim() !== '' }}
                    render={({ field }) => <Input id='title' maxLength={255} invalid={Boolean(errors.title)} {...field} />}
                  />
                  <FormFeedback>Please enter a summary</FormFeedback>
                </Col>
                <Col md={12} className='mb-1'>
                  <FieldLabel>Description</FieldLabel>
                  <Editor value={description} onChange={setDescription} height={260} onImageUpload={uploadEditorImage} />
                </Col>
                <Col md={6} className='mb-1'>
                  <FieldLabel htmlFor='steps_to_reproduce'>Steps To Reproduce</FieldLabel>
                  <Controller
                    name='steps_to_reproduce'
                    control={control}
                    render={({ field }) => <Input id='steps_to_reproduce' type='textarea' rows='5' {...field} />}
                  />
                </Col>
                <Col md={6} className='mb-1'>
                  <FieldLabel htmlFor='additional_info'>Additional Information</FieldLabel>
                  <Controller
                    name='additional_info'
                    control={control}
                    render={({ field }) => <Input id='additional_info' type='textarea' rows='5' {...field} />}
                  />
                </Col>

                <Col md={12}>
                  <h6 className='mt-50 mb-1 text-muted text-uppercase small'>Platform &amp; Versions</h6>
                </Col>
                {creatableField('platform', 'Platform', platformOptions)}
                {creatableField('os', 'OS', osOptions)}
                {textField('os_build', 'OS Build', { placeholder: 'e.g. 14.5' })}
                {textField('product_version', 'Product Version')}
                {textField('target_version', 'Target Version')}
                {isEdit && textField('fixed_in_version', 'Fixed in Version')}

                {!isEdit && (
                  <Col md={12} className='mb-1'>
                    <FieldLabel>Upload Files</FieldLabel>
                    {/* Same drop zone as every other module's attachments;
                        files are held here and uploaded once the issue is saved. */}
                    <AttachmentsField
                      attachments={pendingFiles.map((file, index) => ({ id: index, file_name: file.name, file_size: file.size }))}
                      onFilesSelect={files => setPendingFiles(prev => [...prev, ...files])}
                      onDelete={file => setPendingFiles(prev => prev.filter((_, i) => i !== file.id))}
                    />
                  </Col>
                )}
              </Row>
            </Form>
          )}
        </CardBody>
      </Card>
    </Fragment>
  )
}

export default IssueForm
