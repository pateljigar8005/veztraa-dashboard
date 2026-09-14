// ** React Imports
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ** Store & Actions
import { store } from '@store/store'
import { deleteContract } from '../store'

// ** Icons Imports
import { Copy, Edit2, Trash2 } from 'react-feather'

// ** Reactstrap Imports
import { Badge, Button, UncontrolledTooltip } from 'reactstrap'

// ** Utils
import { currentUserCan } from '@src/utility/navPermissions'
import { confirmDelete } from '@src/utility/confirmDelete'

// ** Options
import { frequencyOptions } from '../contractOptions'

const statusColorObj = {
  draft: 'light-secondary',
  active: 'light-info',
  signed: 'light-success',
  expired: 'light-warning',
  terminated: 'light-danger'
}

const frequencyLabel = value => frequencyOptions.find(i => i.value === value)?.label || value || '-'

export const columns = [
  {
    name: 'Contract #',
    sortable: true,
    minWidth: '140px',
    sortField: 'id',
    selector: row => row.contract_number,
    cell: row => (
      <Link to={`/contract/edit/${row.id}`} className='text-body'>
        <span className='fw-bolder'>{row.contract_number}</span>
      </Link>
    )
  },
  {
    name: 'Customer',
    sortable: true,
    minWidth: '260px',
    sortField: 'contact_name',
    selector: row => row.contact_name,
    cell: row => (
      <div className='d-flex flex-column'>
        <Link to={`/contract/edit/${row.id}`} className='user_name text-truncate text-body'>
          <span className='fw-bolder'>{row.contact_name || row.client_full_name || '-'}</span>
        </Link>
        <small className='text-truncate text-muted mb-0'>{row.company_name || '-'}</small>
      </div>
    )
  },
  {
    name: 'Frequency',
    minWidth: '140px',
    sortable: true,
    sortField: 'frequency',
    selector: row => row.frequency,
    cell: row => <span>{frequencyLabel(row.frequency)}</span>
  },
  {
    name: 'Start Date',
    minWidth: '140px',
    sortable: true,
    sortField: 'start_date',
    selector: row => row.start_date,
    cell: row => <span>{row.start_date || '-'}</span>
  },
  {
    name: 'Status',
    minWidth: '140px',
    sortable: true,
    sortField: 'status',
    selector: row => row.status,
    cell: row => (
      <Badge className='text-capitalize' color={statusColorObj[row.status] || 'light-secondary'} pill>
        {row.status}
      </Badge>
    )
  },
  {
    name: 'Actions',
    right: true,
    minWidth: '130px',
    cell: row => (
      <div className='column-action d-flex align-items-center'>
        {currentUserCan('/contract', 'edit') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/contract/edit/${row.id}`}
              id={`edit-tooltip-${row.id}`}
              className='btn-icon me-1'
              color='flat-primary'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#7367f01f' }}
            >
              <Edit2 size={16} className='text-primary' />
            </Button>
            <UncontrolledTooltip placement='top' target={`edit-tooltip-${row.id}`}>
              Edit
            </UncontrolledTooltip>
          </Fragment>
        )}

        {currentUserCan('/contract', 'add') && (
          <Fragment>
            <Button
              tag={Link}
              to={`/contract/add?clone=${row.id}`}
              id={`clone-tooltip-${row.id}`}
              className='btn-icon me-1'
              color='flat-secondary'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#82868b1f' }}
            >
              <Copy size={16} className='text-secondary' />
            </Button>
            <UncontrolledTooltip placement='top' target={`clone-tooltip-${row.id}`}>
              Clone
            </UncontrolledTooltip>
          </Fragment>
        )}

        {currentUserCan('/contract', 'delete') && (
          <Fragment>
            <Button
              tag='a'
              href='/'
              id={`delete-tooltip-${row.id}`}
              className='btn-icon'
              color='flat-danger'
              size='sm'
              style={{ borderRadius: '4px', backgroundColor: '#ea54551f' }}
              onClick={e => {
                e.preventDefault()
                confirmDelete({
                  text: `This will permanently delete the contract for "${row.contact_name}".`,
                  onConfirm: () =>
                    store.dispatch(deleteContract(row.id)).then(() => toast.success('Contract deleted'))
                })
              }}
            >
              <Trash2 size={16} className='text-danger' />
            </Button>
            <UncontrolledTooltip placement='top' target={`delete-tooltip-${row.id}`}>
              Delete
            </UncontrolledTooltip>
          </Fragment>
        )}
      </div>
    )
  }
]
