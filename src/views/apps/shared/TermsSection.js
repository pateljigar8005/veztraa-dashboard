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
const TermsSection = ({ templateOptions, templateId, onTemplateChange, content, onContentChange, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(false)
  const collapsible = !defaultOpen

  const handleTemplateSelect = option => {
    onTemplateChange(option ? option.value : null)
    if (option) {
      const found = templateOptions.find(t => t.value === option.value)
      if (found) onContentChange(found.content)
    }
  }

  const selected = templateOptions.find(t => t.value === templateId) || null

  const body = (
    <>
      {templateOptions.length === 0 && <p className='text-muted small'>No T&C templates yet.</p>}
      <Select
        isClearable
        className='react-select mb-1'
        classNamePrefix='select'
        theme={selectThemeColors}
        options={templateOptions}
        value={selected}
        onChange={handleTemplateSelect}
        placeholder='— Load from template —'
      />
      <Editor value={content} onChange={onContentChange} height={500} />
    </>
  )

  return (
    <>
      <div className='d-flex justify-content-between align-items-center mb-50'>
        {collapsible ? (
          <div className='d-flex align-items-center' style={{ cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronDown size={16} className='me-50' /> : <ChevronRight size={16} className='me-50' />}
            <Label className='form-label mb-0' style={{ cursor: 'pointer' }}>
              Terms & Conditions
            </Label>
          </div>
        ) : (
          <Label className='form-label mb-0'>Terms & Conditions</Label>
        )}
        <Button tag={Link} to='/terms-template/add' target='_blank' size='sm' outline color='secondary'>
          + Create one
        </Button>
      </div>
      {collapsible ? <Collapse isOpen={isOpen}>{body}</Collapse> : body}
    </>
  )
}

export default TermsSection
