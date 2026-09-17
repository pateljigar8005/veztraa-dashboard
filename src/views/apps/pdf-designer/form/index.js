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

// ** Realistic starter data matching the exact field shape a REAL record of
// this type actually feeds the designer (see buildPdfData() in each type's
// own view/index.js - invoice/quotation/contract) - designing a layout
// against these instead of an empty Data tab means every field a real
// record could bind to is already there to drag onto the canvas, instead of
// the user having to know and hand-type that whole structure themselves.
// 'other' has no real record type behind it, so it's left for the user to
// define their own shape from scratch.
const sampleClient = {
  name: 'Michael Anderson',
  company: 'Acme Corporation',
  email: 'michael.anderson@acme.com',
  phone: '+1 (555) 123-4567',
  address: '123 Business Avenue, Suite 400, San Francisco, CA 94105'
}

const getSampleDataForType = type => {
  if (type === 'invoice') {
    return {
      client: sampleClient,
      document: { number: 'INV-2026-0042', issue_date: '2026-09-01', due_date: '2026-09-30' },
      currency: '$',
      tax_rate: 10,
      tax_amount: '150.00',
      discount_amount: '50.00',
      total: '1,600.00',
      terms_conditions: '<p>Payment is due within 30 days of the invoice date. Late payments may be subject to a 1.5% monthly interest charge.</p>',
      payment_method: '<p>Bank Transfer<br>Account Name: Veztraa Solutions Pvt. Ltd.<br>Account Number: 1234567890<br>IFSC: ABCD0123456</p>',
      service_items: [
        { name: 'Website Design & Development', qty: 1, rate: '1,200.00', amount: '1,200.00' },
        { name: 'Hosting Setup (1 year)', qty: 1, rate: '300.00', amount: '300.00' },
        { name: 'Content Migration', qty: 5, rate: '30.00', amount: '150.00' }
      ]
    }
  }
  if (type === 'quotation') {
    return {
      client: sampleClient,
      document: { number: 'QUO-2026-0018', issue_date: '2026-09-01', due_date: '2026-09-15' },
      currency: '$',
      tax_rate: 10,
      tax_amount: '500.00',
      discount_amount: '0.00',
      total: '5,500.00',
      terms_conditions: '<p>This quotation is valid for 14 days from the issue date. Prices are subject to change after expiry.</p>',
      payment_method: '<p>50% advance to begin work, remaining 50% due on project completion.</p>',
      service_items: [
        { name: 'Mobile App Development - iOS & Android', qty: 1, rate: '4,500.00', amount: '4,500.00' },
        { name: 'UI/UX Design', qty: 1, rate: '500.00', amount: '500.00' }
      ]
    }
  }
  if (type === 'contract') {
    return {
      client: sampleClient,
      document: { number: 'CON-2026-0007', issue_date: '2026-09-01', due_date: '2027-09-01' },
      currency: '',
      tax_rate: 0,
      tax_amount: '0.00',
      discount_amount: '0.00',
      total: '0.00',
      terms_conditions: '<p>This Agreement shall remain in effect for a period of twelve (12) months from the start date, unless terminated earlier in accordance with the terms below.</p>',
      payment_method: '<p>Payments are due within 15 days of each milestone invoice.</p>',
      body: '<p>This Service Agreement ("Agreement") is entered into between <strong>Veztraa Solutions Pvt. Ltd.</strong> ("Provider") and <strong>Acme Corporation</strong> ("Client") for the provision of the services described herein.</p>',
      service_items: []
    }
  }
  return undefined
}

const statusOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' }
]

// ** These two selects sit directly above the designer canvas below (see
// #PDF_DESIGNER_SCOPE_ID), whose own scoped-but-still-broad Tailwind reset
// (see reportDesignerStyleGuard.js) ends up left the dropdown menu's
// background translucent and under the designer's own toolbar in stacking
// order - its "Header/Body/Footer" tab labels visibly bleed through the open
// menu otherwise. Forcing a fully opaque background plus a z-index well
// above the designer's own UI fixes both at once.
const selectMenuStyles = {
  menu: base => ({ ...base, backgroundColor: '#fff', opacity: 1, zIndex: 9999 }),
  menuList: base => ({ ...base, backgroundColor: '#fff' })
}

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

  // ** A brand new template (not editing, not cloning - those load their own
  // sample_data from the source record in the effect below, which this must
  // never override) starts pre-filled with realistic sample data matching
  // the default type ('invoice'), so the Data tab already has real fields to
  // drag onto the canvas from the very first render.
  useEffect(() => {
    if (isEdit || cloneId) return
    const sample = getSampleDataForType(type)
    setInitialSampleData(sample)
    sampleDataRef.current = sample
    // Deliberately empty deps - only the very first mount of a fresh Add
    // page, never again (re-selecting Type below handles every change
    // after that; re-running this on [type] too would double-fire it).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // ** Re-picking Type on a brand new template re-seeds the Data tab for
  // that type - an explicit, user-initiated action, so it's fine to replace
  // whatever sample data was there before (same reasoning as the initial
  // mount effect above). Editing an existing template never does this - its
  // sample_data belongs to the real template being edited, and the whole
  // point here is only ever helping populate what starts out as a truly
  // blank slate.
  const handleTypeChange = option => {
    setType(option.value)
    if (isEdit || cloneId) return
    const sample = getSampleDataForType(option.value)
    setInitialSampleData(sample)
    sampleDataRef.current = sample
  }

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
              onChange={handleTypeChange}
              isSearchable={false}
              styles={selectMenuStyles}
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
              styles={selectMenuStyles}
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
