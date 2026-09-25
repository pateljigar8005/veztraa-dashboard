import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, Table } from 'reactstrap'
import { addRole, updateRole, getRole } from '../store'
import { menuPermissionGroups } from '../menuPermissions'
import HistoryModal from '../../../activity-log/HistoryModal'

const actions = ['view', 'add', 'edit', 'delete', 'export']
const nonViewActions = actions.filter(a => a !== 'view')

const applyPermissionRule = (entry, action, checked) => {
  const next = { ...entry, [action]: checked }
  if (action === 'view' && !checked) {
    nonViewActions.forEach(a => {
      next[a] = false
    })
  } else if (action !== 'view' && checked) {
    next.view = true
  }
  return next
}

const defaultValues = { name: '' }

const RoleForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.roles)

  const [permissions, setPermissions] = useState({})
  const [extraDirty, setExtraDirty] = useState(false)

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty || extraDirty)

  useEffect(() => {
    if (isEdit) dispatch(getRole(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedRole && store.selectedRole.id === Number(id)) {
      reset({ name: store.selectedRole.name || '' })
      setPermissions(store.selectedRole.permissions || {})
    }
  }, [store.selectedRole])

  const isChecked = (menuId, action) => !!permissions[menuId]?.[action]

  const togglePermission = (menuId, action) => {
    setPermissions(prev => {
      const current = prev[menuId] || {}
      return { ...prev, [menuId]: applyPermissionRule(current, action, !current[action]) }
    })
    setExtraDirty(true)
  }

  const allItems = menuPermissionGroups.flatMap(group => group.items)

  const isColumnAllChecked = action => allItems.every(item => isChecked(item.id, action))

  const toggleColumn = (action, checked) => {
    setPermissions(prev => {
      const next = { ...prev }
      allItems.forEach(item => {
        next[item.id] = applyPermissionRule(next[item.id] || {}, action, checked)
      })
      return next
    })
    setExtraDirty(true)
  }

  const isRowAllChecked = menuId => actions.every(action => isChecked(menuId, action))

  const toggleRow = (menuId, checked) => {
    setPermissions(prev => ({
      ...prev,
      [menuId]: { view: checked, add: checked, edit: checked, delete: checked, export: checked }
    }))
    setExtraDirty(true)
  }

  const onSubmit = data => {
    if (data.name.length === 0) {
      setError('name', { type: 'manual' })
      return
    }

    const action = isEdit
      ? updateRole({ id: Number(id), name: data.name, permissions })
      : addRole({ name: data.name, permissions })
    dispatch(action)
      .unwrap()
      .then(() => {
        toast.success(isEdit ? 'Role updated' : 'Role added')
        navigate('/roles')
      })
      .catch(err => toast.error(err?.message || 'Failed to save role'))
  }

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>{isEdit ? 'Edit Role' : 'Add New Role'}</CardTitle>
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='name'>
                  Role Name <span className='text-danger'>*</span>
                </Label>
                <Controller
                  name='name'
                  control={control}
                  render={({ field }) => (
                    <Input id='name' placeholder='e.g. Manager' invalid={errors.name && true} {...field} />
                  )}
                />
              </Col>
            </Row>

            <h4 className='mt-2 pt-50'>Menu Permissions</h4>
            <p className='text-muted'>Choose which actions this role can perform on each module.</p>

            <Table responsive className='mb-0' bordered>
              <thead>
                <tr>
                  <th className='text-nowrap'>Module</th>
                  {actions.map(action => (
                    <th key={action} className='text-center text-capitalize'>
                      <div
                        className='form-check d-flex flex-column align-items-center'
                        style={{ paddingLeft: 0 }}
                      >
                        <Input
                          type='checkbox'
                          id={`col-${action}`}
                          className='mb-25'
                          style={{ marginLeft: 0 }}
                          checked={isColumnAllChecked(action)}
                          onChange={e => toggleColumn(action, e.target.checked)}
                        />
                        <Label className='form-check-label mb-0' for={`col-${action}`}>
                          {action}
                        </Label>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menuPermissionGroups.map(group => (
                  <Fragment key={group.section}>
                    <tr className='table-light'>
                      <td colSpan={actions.length + 1} className='fw-bolder'>
                        {group.section}
                      </td>
                    </tr>
                    {group.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className='form-check'>
                            <Input
                              type='checkbox'
                              id={`row-${item.id}`}
                              checked={isRowAllChecked(item.id)}
                              onChange={e => toggleRow(item.id, e.target.checked)}
                            />
                            <Label className='form-check-label' for={`row-${item.id}`}>
                              {item.title}
                            </Label>
                          </div>
                        </td>
                        {actions.map(action => (
                          <td key={action} className='text-center'>
                            <div className='form-check d-inline-block'>
                              <Input
                                type='checkbox'
                                id={`perm-${item.id}-${action}`}
                                checked={isChecked(item.id, action)}
                                onChange={() => togglePermission(item.id, action)}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </Form>
        </CardBody>
      </Card>
      {isEdit && <HistoryModal entityType='role' entityId={Number(id)} buttonId='role-history-btn' />}
    </Fragment>
  )
}

export default RoleForm