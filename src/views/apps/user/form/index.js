// ** React Imports
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input, FormText } from 'reactstrap'

// ** Store & Actions
import { addUser, updateUser, getUser } from '../store'

const defaultValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: ''
}

const UserForm = () => {
  // ** Hooks & Vars
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.users)

  // ** States
  const [roles, setRoles] = useState([])
  const [roleId, setRoleId] = useState('')

  const {
    control,
    reset,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({ defaultValues })

  // ** Fetch roles for the dropdown
  useEffect(() => {
    axios.get('/roles').then(response => {
      const data = response.data.data
      setRoles(data)
      if (!isEdit && data.length) setRoleId(String(data[0].id))
    })
  }, [])

  // ** Fetch the user being edited
  useEffect(() => {
    if (isEdit) dispatch(getUser(id))
  }, [id])

  // ** Populate the form once the user loads
  useEffect(() => {
    if (isEdit && store.selectedUser && store.selectedUser.id === Number(id)) {
      const user = store.selectedUser
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: ''
      })
      if (user.role_id) setRoleId(String(user.role_id))
    }
  }, [store.selectedUser])

  const checkIsValid = data => {
    const requiredOk = ['first_name', 'last_name', 'email', 'phone'].every(key => data[key].length > 0)
    const passwordOk = isEdit || data.password.length > 0
    return requiredOk && passwordOk
  }

  const onSubmit = data => {
    if (checkIsValid(data) && roleId) {
      const payload = {
        role_id: Number(roleId),
        email: data.email,
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name
      }
      if (data.password.length) payload.password = data.password

      const action = isEdit ? updateUser({ id: Number(id), ...payload }) : addUser(payload)
      dispatch(action).then(() => {
      toast.success(isEdit ? 'User updated' : 'User added')
      navigate('/user')
    })
    } else {
      for (const key in data) {
        if (key === 'password' && isEdit) continue
        if (data[key].length === 0) {
          setError(key, { type: 'manual' })
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle tag='h4'>{isEdit ? 'Edit User' : 'Add New User'}</CardTitle>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='first_name'>
                First Name <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='first_name'
                control={control}
                render={({ field }) => (
                  <Input id='first_name' placeholder='John' invalid={errors.first_name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='last_name'>
                Last Name <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='last_name'
                control={control}
                render={({ field }) => (
                  <Input id='last_name' placeholder='Doe' invalid={errors.last_name && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='email'>
                Email <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='email'
                control={control}
                render={({ field }) => (
                  <Input
                    type='email'
                    id='email'
                    placeholder='john.doe@example.com'
                    invalid={errors.email && true}
                    {...field}
                  />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='phone'>
                Phone <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='phone'
                control={control}
                render={({ field }) => (
                  <Input id='phone' placeholder='(397) 294-5153' invalid={errors.phone && true} {...field} />
                )}
              />
            </Col>
            <Col md={6} className='mb-1'>
              <Label className='form-label' for='password'>
                Password {!isEdit && <span className='text-danger'>*</span>}
              </Label>
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <Input type='password' id='password' invalid={errors.password && true} {...field} />
                )}
              />
              <FormText color='muted'>
                {isEdit ? 'Leave blank to keep the current password' : 'Minimum 6 characters'}
              </FormText>
            </Col>
            <Col md={6}>
              <Label className='form-label' for='user-role'>
                User Role
              </Label>
              <Input type='select' id='user-role' value={roleId} onChange={e => setRoleId(e.target.value)}>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Input>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  )
}

export default UserForm
