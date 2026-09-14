// ** React Imports
import { useState } from 'react'
import { Link } from 'react-router-dom'

// ** Third Party Components
import Select from 'react-select'
import { Editor } from '@veztraa/editor'
import { ChevronDown, ChevronRight } from 'react-feather'

// ** Reactstrap Imports
import { Label, Button, Collapse } from 'reactstrap'

// ** Utils
import { selectThemeColors } from '@utils'

// `defaultOpen` (edit/clone) skips the collapse UI entirely - existing
// content should just be visible, not hidden behind a click. Only a fresh
// Add page (nothing to review yet) gets the collapsible, collapsed-by-default
// version.
const PaymentMethodSection = ({ methodOptions, methodId, onMethodChange, content, onContentChange, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(false)
  const collapsible = !defaultOpen

  const handleMethodSelect = option => {
    onMethodChange(option ? option.value : null)
    if (option) {
      const found = methodOptions.find(m => m.value === option.value)
      if (found) onContentChange(found.content)
    }
  }

  const selected = methodOptions.find(m => m.value === methodId) || null

  const body = (
    <>
      {methodOptions.length === 0 && <p className='text-muted small'>No payment methods yet.</p>}
      <Select
        isClearable
        className='react-select mb-1'
        classNamePrefix='select'
        theme={selectThemeColors}
        options={methodOptions}
        value={selected}
        onChange={handleMethodSelect}
        placeholder='— Load from payment method —'
      />
      <Editor value={content} onChange={onContentChange} height={300} />
    </>
  )

  return (
    <>
      <div className='d-flex justify-content-between align-items-center mb-50'>
        {collapsible ? (
          <div className='d-flex align-items-center' style={{ cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronDown size={16} className='me-50' /> : <ChevronRight size={16} className='me-50' />}
            <Label className='form-label mb-0' style={{ cursor: 'pointer' }}>
              Payment Method
            </Label>
          </div>
        ) : (
          <Label className='form-label mb-0'>Payment Method</Label>
        )}
        <Button tag={Link} to='/payment-method/add' target='_blank' size='sm' outline color='secondary'>
          + Create one
        </Button>
      </div>
      {collapsible ? <Collapse isOpen={isOpen}>{body}</Collapse> : body}
    </>
  )
}

export default PaymentMethodSection
