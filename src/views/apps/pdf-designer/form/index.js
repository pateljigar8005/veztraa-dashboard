// ** React Imports
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

// ** Third Party Components
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useDispatch, useSelector } from 'react-redux'
import { ReportDesigner } from '@veztraa/report-designer'

// ** Reactstrap Imports
import { Card, CardBody, Row, Col, Label, Input } from 'reactstrap'

// ** Select Theme
import { selectThemeColors } from '@utils'

// ** Store & Actions
import { addPdfDesignerTemplate, updatePdfDesignerTemplate, getPdfDesignerTemplate } from '../store'

// ** Utils - see this file for why the designer's CSS is scoped rather than
// rendered inside an isolated iframe (an iframe would break its drag-and-drop)
import { PDF_DESIGNER_SCOPE_ID } from '@src/utility/reportDesignerStyleGuard'

const typeOptions = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'quotation', label: 'Quotation' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' }
]

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

const PdfDesignerTemplateForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const cloneId = searchParams.get('clone')
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.pdfDesignerTemplates)

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)
  const [type, setType] = useState('invoice')
  const [isActive, setIsActive] = useState(true)
  const [template, setTemplate] = useState(undefined)
  // Seeds the designer's Data tab once when the template loads. Kept separate
  // from the *live* value the user is editing (sampleDataRef below) - if we
  // fed every keystroke's onDataChange back into this as a new object
  // reference, the designer treats a changed `data` prop as a full reset of
  // its field editor, remounting it and dropping focus after every character
  // typed, making the fields effectively impossible to edit.
  const [initialSampleData, setInitialSampleData] = useState(undefined)
  const sampleDataRef = useRef(undefined)

  // ** Fetch the template being edited, or the source template being cloned
  useEffect(() => {
    if (isEdit) dispatch(getPdfDesignerTemplate(id))
    else if (cloneId) dispatch(getPdfDesignerTemplate(cloneId))
  }, [id, cloneId])

  useEffect(() => {
    const sourceId = isEdit ? Number(id) : Number(cloneId)
    if (sourceId && store.selectedPdfDesignerTemplate && store.selectedPdfDesignerTemplate.id === sourceId) {
      const record = store.selectedPdfDesignerTemplate
      setName(isEdit ? record.name || '' : `${record.name || ''} (Copy)`)
      setType(record.type || 'invoice')
      setIsActive(record.is_active !== false)
      setTemplate(record.template)
      setInitialSampleData(record.sample_data)
      sampleDataRef.current = record.sample_data
    }
  }, [store.selectedPdfDesignerTemplate])

  // ** The designer has no ref/onChange API to pull its current template from,
  // so its own toolbar Save button (wired below) is what actually persists this
  // page (the navbar Save icon forwards its click into this same button - see
  // NavbarBookmarks.js).
  const handleDesignerSave = designerTemplate => {
    if (!name.trim()) {
      setNameError(true)
      toast.error('Please enter a template name before saving')
      return
    }

    const payload = { name, type, is_active: isActive, template: designerTemplate, sample_data: sampleDataRef.current || {} }
    const action = isEdit
      ? updatePdfDesignerTemplate({ id: Number(id), ...payload })
      : addPdfDesignerTemplate(payload)

    dispatch(action).then(result => {
      toast.success(isEdit ? 'PDF designer template updated' : 'PDF designer template added')
      // Stay in the designer instead of bouncing back to the list. A brand
      // new template has no id yet, though - move the URL onto its real
      // edit route (replacing /add) so a second Save updates it instead of
      // silently creating a duplicate template each time.
      if (!isEdit) {
        navigate(`/pdf-designer/edit/${result.payload.id}`, { replace: true })
      }
    })
  }

  return (
    <Card>
      <CardBody>
        <Row className='mb-1'>
          <Col md={4} className='mb-1 mb-md-0'>
            <Label className='form-label' for='name'>
              Template Name <span className='text-danger'>*</span>
            </Label>
            <Input
              id='name'
              placeholder='Invoice Layout A'
              value={name}
              invalid={nameError}
              onChange={e => {
                setName(e.target.value)
                if (e.target.value.trim()) setNameError(false)
              }}
            />
          </Col>
          <Col md={4} className='mb-1 mb-md-0'>
            <Label className='form-label' for='type'>
              Type
            </Label>
            <Select
              inputId='type'
              theme={selectThemeColors}
              className='react-select'
              classNamePrefix='select'
              options={typeOptions}
              value={typeOptions.find(o => o.value === type)}
              onChange={option => setType(option.value)}
              isSearchable={false}
            />
          </Col>
          <Col md={4}>
            <Label className='form-label' for='status'>
              Status
            </Label>
            <Select
              inputId='status'
              theme={selectThemeColors}
              className='react-select'
              classNamePrefix='select'
              options={statusOptions}
              value={statusOptions.find(o => o.value === isActive)}
              onChange={option => setIsActive(option.value)}
              isSearchable={false}
            />
          </Col>
        </Row>
        <div
          id={PDF_DESIGNER_SCOPE_ID}
          style={{ height: '75vh', border: '1px solid #d8d6de', borderRadius: '0.357rem', overflow: 'hidden' }}
        >
          <ReportDesigner
            report={template}
            data={initialSampleData}
            onDataChange={dataStr => {
              // Only captured for Save - see sampleDataRef above for why this
              // deliberately does NOT feed back into the `data` prop live.
              try {
                sampleDataRef.current = JSON.parse(dataStr)
              } catch (e) {
                // ignore - keep the last valid sample data until this parses
              }
            }}
            theme='light'
            accentColor='#7367f0'
            toolbar={{ onSave: handleDesignerSave }}
          />
        </div>
      </CardBody>
    </Card>
  )
}

export default PdfDesignerTemplateForm
