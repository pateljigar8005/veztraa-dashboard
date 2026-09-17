// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import axios from 'axios'

// ** Reactstrap Imports
import { Modal, ModalHeader, ModalBody, ModalFooter, Table, Button, Input } from 'reactstrap'

// ** Utils
import { formatAmount } from '@utils'

const CatalogModal = ({ isOpen, toggle, onAdd }) => {
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    if (isOpen) {
      axios.get('/service-items', { params: { perPage: 100 } }).then(response => {
        setItems(response.data.data.serviceItems)
      })
      setSelectedIds([])
    }
  }, [isOpen])

  const toggleSelect = id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  const handleAddSelected = () => {
    onAdd(items.filter(item => selectedIds.includes(item.id)))
    toggle()
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} size='lg'>
      <ModalHeader toggle={toggle}>Add from Catalog</ModalHeader>
      <ModalBody className='p-0'>
        <Table responsive className='mb-0'>
          <thead className='table-light'>
            <tr>
              <th style={{ width: '56px', paddingLeft: '1.5rem' }}></th>
              <th>Name</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => toggleSelect(item.id)} style={{ cursor: 'pointer' }}>
                <td onClick={e => e.stopPropagation()} style={{ paddingLeft: '1.5rem' }}>
                  <div className='form-check'>
                    <Input type='checkbox' checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                  </div>
                </td>
                <td>{item.name}</td>
                <td>${formatAmount(item.price)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className='text-muted'>
                  No service items yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </ModalBody>
      <ModalFooter>
        <Button color='primary' disabled={selectedIds.length === 0} onClick={handleAddSelected}>
          Add{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </Button>
        <Button color='secondary' outline onClick={toggle}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default CatalogModal
