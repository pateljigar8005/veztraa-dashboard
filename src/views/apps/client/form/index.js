import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard'
import axios from 'axios'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Form, Label, Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import { addClient, updateClient, getClient } from '../store'
import HistoryModal from '../../activity-log/HistoryModal'

const defaultValues = {
  first_name: '',
  last_name: '',
  company_name: '',
  email: '',
  phone: '',
  address: ''
}

const ClientForm = () => {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const store = useSelector(state => state.clients)

  const [currencyOptions, setCurrencyOptions] = useState([])
  const [industryOptions, setIndustryOptions] = useState([])

  const {
    control,
    reset,
    setValue,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isDirty }
  } = useForm({ defaultValues })

  useUnsavedChangesGuard(isDirty)

  const industryId = watch('industry_id')
  const currencyId = watch('currency_id')

  useEffect(() => {
    axios.get('/currencies', { params: { perPage: 100 } }).then(response => {
      const active = response.data.data.currencies.filter(c => c.is_active)
      setCurrencyOptions(active.map(c => ({ value: c.id, label: `${c.name} (${c.icon})` })))
    })
    axios.get('/industries', { params: { perPage: 100 } }).then(response => {
      const active = response.data.data.industries.filter(i => i.is_active)
      setIndustryOptions(active.map(i => ({ value: i.id, label: i.name })))
    })
  }, [])

  useEffect(() => {
    if (isEdit) dispatch(getClient(id))
  }, [id])

  useEffect(() => {
    if (isEdit && store.selectedClient && store.selectedClient.id === Number(id)) {
      const client = store.selectedClient
      reset({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        company_name: client.company_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || ''
      })
      setValue('industry_id', client.industry_id || '')
      setValue('currency_id', client.currency_id || '')
    }
  }, [store.selectedClient])

  const checkIsValid = data => ['first_name', 'last_name', 'email'].every(key => data[key].length > 0)

  const onSubmit = data => {
    if (checkIsValid(data)) {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        industry_id: industryId || null,
        currency_id: currencyId || null
      }

      const action = isEdit ? updateClient({ id: Number(id), ...payload }) : addClient(payload)
      dispatch(action).then(() => {
      toast.success(isEdit ? 'Client updated' : 'Client added')
      navigate('/client')
    })
    } else {
      for (const key in data) {
        if (data[key].length === 0) {
          setError(key, { type: 'manual' })
        }
      }
    }
  }

  const selectedIndustryOption = industryOptions.find(i => i.value === industryId) || null
  const selectedCurrencyOption = currencyOptions.find(c => c.value === currencyId) || null

  return (
    <Fragment>
      <Card>
        <CardHeader>
          <CardTitle tag='h4'>{isEdit ? 'Edit Client' : 'Add New Client'}</CardTitle>
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
                <Label className='form-label' for='company_name'>
                  Company Name
                </Label>
                <Controller
                  name='company_name'
                  control={control}
                  render={({ field }) => <Input id='company_name' placeholder='Acme Corporation' {...field} />}
                />
              </Col>
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='industry'>
                  Industry
                </Label>
                <Select
                  inputId='industry'
                  isClearable
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={industryOptions}
                  value={selectedIndustryOption}
                  onChange={option => setValue('industry_id', option ? option.value : '', { shouldDirty: true })}
                  placeholder='Select industry...'
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
                  Phone
                </Label>
                <Controller
                  name='phone'
                  control={control}
                  render={({ field }) => <Input id='phone' placeholder='(397) 294-5153' {...field} />}
                />
              </Col>
              <Col md={6} className='mb-1'>
                <Label className='form-label' for='currency_id'>
                  Currency
                </Label>
                <Select
                  inputId='currency_id'
                  isClearable
                  classNamePrefix='select'
                  className='react-select'
                  theme={selectThemeColors}
                  options={currencyOptions}
                  value={selectedCurrencyOption}
                  onChange={option => setValue('currency_id', option ? option.value : '', { shouldDirty: true })}
                  placeholder='Select currency...'
                />
              </Col>
              <Col md={12}>
                <Label className='form-label' for='address'>
                  Address
                </Label>
                <Controller
                  name='address'
                  control={control}
                  render={({ field }) => (
                    <Input type='textarea' rows='2' id='address' placeholder='1307 Lady Bug Drive, New York' {...field} />
                  )}
                />
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>
      {isEdit && <HistoryModal entityType='client' entityId={Number(id)} buttonId='client-history-btn' />}
    </Fragment>
  )
}

export default ClientForm