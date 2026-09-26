import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Select from 'react-select'
import { Editor } from '@veztraa/editor'
import { ChevronDown, ChevronRight } from 'react-feather'
import { Label, Button, Collapse } from 'reactstrap'
import { selectThemeColors, uploadEditorImage } from '@utils'

const TermsSection = ({ templateOptions, templateId, onTemplateChange, content, onContentChange, defaultOpen }) => {
  const [isOpen, setIsOpen] = useState(false)
  // The editor can emit an onChange while it loads / normalises the saved HTML.
  // Only report changes once the user has actually interacted with it, so a
  // form that has not been touched is never flagged as having unsaved changes.
  const userEdited = useRef(false)
  const markEdited = () => {
    userEdited.current = true
  }
  const handleEditorChange = value => {
    if (userEdited.current) onContentChange(value)
  }
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
      <div
        onKeyDownCapture={markEdited}
        onMouseDownCapture={markEdited}
        onPasteCapture={markEdited}
        onCutCapture={markEdited}
        onDropCapture={markEdited}
      >
        <Editor value={content} onChange={handleEditorChange} height={500} onImageUpload={uploadEditorImage} />
      </div>
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