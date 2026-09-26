import { useRef, useState } from 'react'
import { Controller } from 'react-hook-form'
import { X } from 'react-feather'
import { CardBody, Table, Input, Button } from 'reactstrap'
import AmountField from './AmountField'
import GripVerticalIcon from './GripVerticalIcon'
import { formatAmount } from '@utils'

const LineItemsTable = ({ control, fields, lineItems, remove, move, onAddItem, onOpenCatalog, currency }) => {
  const dragIndex = useRef(null)
  const [overIndex, setOverIndex] = useState(null)

  const handleDragStart = index => {
    dragIndex.current = index
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setOverIndex(index)
  }

  const handleDrop = index => {
    if (dragIndex.current !== null && dragIndex.current !== index) {
      move(dragIndex.current, index)
    }
    dragIndex.current = null
    setOverIndex(null)
  }

  return (
    <>
      <CardBody className='p-0'>
        <Table responsive className='mb-0'>
          <thead className='table-light'>
            <tr>
              <th style={{ width: '26px', paddingRight: 0 }}></th>
              <th style={{ paddingLeft: '1rem' }}>Description</th>
              <th style={{ width: '120px' }}>Qty</th>
              <th style={{ width: '160px' }}>Rate</th>
              <th style={{ width: '110px' }}>Amount</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const qty = Number(lineItems?.[index]?.qty) || 0
              const rate = Number(lineItems?.[index]?.rate) || 0
              return (
                <tr
                  key={field.id}
                  onDragOver={e => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  style={overIndex === index ? { borderTop: '2px solid #7367f0' } : undefined}
                >
                  <td
                    className='align-middle text-center'
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    style={{ cursor: 'grab', paddingRight: 0 }}
                  >
                    <GripVerticalIcon size={12} className='drag-handle text-muted' />
                  </td>
                  <td style={{ paddingLeft: '1rem' }}>
                    <Controller
                      name={`line_items.${index}.description`}
                      control={control}
                      render={({ field }) => <Input placeholder='Item description' {...field} />}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`line_items.${index}.qty`}
                      control={control}
                      render={({ field }) => <Input type='number' min='0' {...field} />}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`line_items.${index}.rate`}
                      control={control}
                      render={({ field }) => <AmountField value={field.value} onChange={field.onChange} />}
                    />
                  </td>
                  <td className='fw-bolder align-middle'>{currency || '$'}{formatAmount(qty * rate)}</td>
                  <td className='align-middle'>
                    <Button
                      color='flat-danger'
                      size='sm'
                      className='btn-icon'
                      style={{ borderRadius: '4px', backgroundColor: '#ea54551f' }}
                      onClick={() => remove(index)}
                    >
                      <X size={14} className='text-danger' />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </CardBody>
      <CardBody>
        <Button color='primary' outline size='sm' className='me-1' onClick={onAddItem}>
          + Add Item
        </Button>
        <Button color='secondary' outline size='sm' onClick={onOpenCatalog}>
          From Catalog
        </Button>
      </CardBody>
    </>
  )
}

export default LineItemsTable