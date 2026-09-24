import { useEffect, useState } from 'react'
import Select from 'react-select'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Label, Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import DateField from './DateField'
import AmountField from './AmountField'

const AdvancedSearchModal = ({ isOpen, toggle, title = 'Advanced Search', fields, values, onApply, onClear }) => {
  const [formValues, setFormValues] = useState({})
  const [optionsByField, setOptionsByField] = useState({})

  useEffect(() => {
    if (!isOpen) return
    setFormValues(values || {})

    fields.forEach(field => {
      if (field.type === 'select' && field.fetchOptions && !optionsByField[field.name]) {
        field.fetchOptions().then(options => {
          setOptionsByField(prev => ({ ...prev, [field.name]: options }))
        })
      }
    })
  }, [isOpen])

  const setValue = (key, val) => setFormValues(prev => ({ ...prev, [key]: val }))

  const handleApply = () => {
    // An empty array (an isMulti select cleared out) means the same thing
    // as '' /null/undefined here - "not filtering on this" - so it's
    // dropped the same way, not sent through as assignee_id: [].
    const cleaned = Object.fromEntries(
      Object.entries(formValues).filter(
        ([, v]) => v !== '' && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
      )
    )
    onApply(cleaned)
    toggle()
  }

  const handleClear = () => {
    setFormValues({})
    onClear()
    toggle()
  }

  const renderField = field => {
    const options = field.options || optionsByField[field.name] || []

    switch (field.type) {
      case 'select':
        // isMulti is opt-in per field (e.g. Todo's Assignee filter, admin
        // only - see Tasks.js) - every other select-type field across the
        // app is untouched, still a single value in formValues.
        if (field.isMulti) {
          const selected = Array.isArray(formValues[field.name]) ? formValues[field.name] : []
          return (
            <Col md={6} className='mb-1' key={field.name}>
              <Label className='form-label' for={`adv-search-${field.name}`}>
                {field.label}
              </Label>
              <Select
                isMulti
                inputId={`adv-search-${field.name}`}
                isClearable
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={options}
                value={options.filter(o => selected.map(String).includes(String(o.value)))}
                onChange={picked => setValue(field.name, (picked || []).map(o => o.value))}
                placeholder={`Select ${field.label.toLowerCase()}...`}
              />
            </Col>
          )
        }
        return (
          <Col md={6} className='mb-1' key={field.name}>
            <Label className='form-label' for={`adv-search-${field.name}`}>
              {field.label}
            </Label>
            <Select
              inputId={`adv-search-${field.name}`}
              isClearable
              className='react-select'
              classNamePrefix='select'
              theme={selectThemeColors}
              options={options}
              value={options.find(o => String(o.value) === String(formValues[field.name])) || null}
              onChange={option => setValue(field.name, option ? option.value : '')}
              placeholder={`Select ${field.label.toLowerCase()}...`}
            />
          </Col>
        )
      case 'date-range':
        return (
          <Col md={6} className='mb-1' key={field.name}>
            <Label className='form-label'>{field.label}</Label>
            <div className='d-flex' style={{ gap: '0.5rem' }}>
              <DateField
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_from`] || ''}
                onChange={value => setValue(`${field.name}_from`, value)}
              />
              <DateField
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_to`] || ''}
                onChange={value => setValue(`${field.name}_to`, value)}
              />
            </div>
          </Col>
        )
      case 'number-range':
        return (
          <Col md={6} className='mb-1' key={field.name}>
            <Label className='form-label'>{field.label}</Label>
            <div className='d-flex' style={{ gap: '0.5rem' }}>
              <AmountField
                placeholder='Min'
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_from`] || ''}
                onChange={value => setValue(`${field.name}_from`, value)}
              />
              <AmountField
                placeholder='Max'
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_to`] || ''}
                onChange={value => setValue(`${field.name}_to`, value)}
              />
            </div>
          </Col>
        )
      default:
        return (
          <Col md={6} className='mb-1' key={field.name}>
            <Label className='form-label' for={`adv-search-${field.name}`}>
              {field.label}
            </Label>
            <Input
              id={`adv-search-${field.name}`}
              value={formValues[field.name] || ''}
              onChange={e => setValue(field.name, e.target.value)}
            />
          </Col>
        )
    }
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size='lg'>
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <ModalBody>
        <Row>{fields.map(renderField)}</Row>
      </ModalBody>
      <ModalFooter>
        <Button color='secondary' outline onClick={handleClear}>
          Clear
        </Button>
        <Button color='primary' onClick={handleApply}>
          Apply Filters
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default AdvancedSearchModal