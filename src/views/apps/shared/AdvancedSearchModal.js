// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import Select from 'react-select'

// ** Reactstrap Imports
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Label, Input } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

// ** Generic "advanced search" popup, driven entirely by a `fields` config so
// every list page can reuse the same component instead of hand-rolling its
// own filter form. Supported field types:
//   - text            -> a single Input, sent as {[name]: value}
//   - select          -> a react-select, options given directly or fetched
//                        once via `fetchOptions()`, sent as {[name]: value}
//   - date-range       -> two date Inputs, sent as {[name]_from, [name]_to}
//   - number-range     -> two number Inputs, sent as {[name]_from, [name]_to}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const setValue = (key, val) => setFormValues(prev => ({ ...prev, [key]: val }))

  const handleApply = () => {
    // Drop empty values so the request only carries filters actually set
    const cleaned = Object.fromEntries(Object.entries(formValues).filter(([, v]) => v !== '' && v !== null && v !== undefined))
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
              <Input
                type='date'
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_from`] || ''}
                onChange={e => setValue(`${field.name}_from`, e.target.value)}
              />
              <Input
                type='date'
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_to`] || ''}
                onChange={e => setValue(`${field.name}_to`, e.target.value)}
              />
            </div>
          </Col>
        )
      case 'number-range':
        return (
          <Col md={6} className='mb-1' key={field.name}>
            <Label className='form-label'>{field.label}</Label>
            <div className='d-flex' style={{ gap: '0.5rem' }}>
              <Input
                type='number'
                placeholder='Min'
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_from`] || ''}
                onChange={e => setValue(`${field.name}_from`, e.target.value)}
              />
              <Input
                type='number'
                placeholder='Max'
                style={{ minWidth: 0, flex: 1 }}
                value={formValues[`${field.name}_to`] || ''}
                onChange={e => setValue(`${field.name}_to`, e.target.value)}
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
