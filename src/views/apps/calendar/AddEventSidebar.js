import { Fragment, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Avatar from '@components/avatar'
import { X } from 'react-feather'
import toast from 'react-hot-toast'
import Flatpickr from 'react-flatpickr'
import Select, { components } from 'react-select'
import { useForm, Controller } from 'react-hook-form'
import { Button, Modal, ModalBody, ModalFooter, Label, Input, Form } from 'reactstrap'
import { selectThemeColors, isObjEmpty, toDateOnly } from '@utils'
import { fetchEvents } from './store'
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/flatpickr/flatpickr.scss'

const AddEventSidebar = props => {
  const {
    open,
    store,
    dispatch,
    addEvent,
    calendarApi,
    selectEvent,
    updateEvent,
    removeEvent,
    refetchEvents,
    handleAddEventSidebar,
    holidayDates,
    getHolidayName,
    isWeekend
  } = props

  const eventCategories = store.eventCategories

  const selectedEvent = store.selectedEvent,
    {
      control,
      setError,
      setValue,
      getValues,
      handleSubmit,
      formState: { errors }
    } = useForm({
      defaultValues: { title: '' }
    })

  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [guests, setGuests] = useState([])
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [endPicker, setEndPicker] = useState(new Date())
  const [startPicker, setStartPicker] = useState(new Date())
  const [calendarLabel, setCalendarLabel] = useState([])
  const [userOptions, setUserOptions] = useState([])

  const options = eventCategories.map(c => ({ value: c.id, label: c.name, color: c.color }))

  useEffect(() => {
    if (!open || userOptions.length) return
    axios.get('/users', { params: { perPage: 200 } }).then(response => {
      const users = response.data?.data?.users || []
      setUserOptions(
        users.filter(u => u.is_active).map(u => ({ value: u.id, label: u.fullName, avatar: u.avatar }))
      )
    })
  }, [open])

  const OptionComponent = ({ data, ...props }) => {
    return (
      <components.Option {...props}>
        <span className={`bullet bullet-${data.color} bullet-sm me-50`}></span>
        {data.label}
      </components.Option>
    )
  }

  const GuestsComponent = ({ data, ...props }) => {
    return (
      <components.Option {...props}>
        <div className='d-flex flex-wrap align-items-center'>
          <Avatar
            className='my-0 me-1'
            size='sm'
            img={data.avatar}
            content={data.label}
            initials={!data.avatar}
          />
          <div>{data.label}</div>
        </div>
      </components.Option>
    )
  }

  const blockReasonForDate = date => {
    if (!date) return null
    const holidayName = getHolidayName(toDateOnly(date))
    if (holidayName) return `${holidayName} - no events can be added on a holiday`
    if (isWeekend(date)) return 'Weekend - no events can be added on this date'
    return null
  }

  const handleAddEvent = () => {
    const blockReason = blockReasonForDate(startPicker) || blockReasonForDate(endPicker)
    if (blockReason) {
      toast.error(blockReason)
      return
    }
    if (!calendarLabel.length) {
      toast.error('Pick an event category first - add one under Settings > Event Categories if none exist yet.')
      return
    }

    const obj = {
      title: getValues('title'),
      start: startPicker,
      end: endPicker,
      allDay,
      url: url.length ? url : '',
      display: 'block',
      extendedProps: {
        calendar: calendarLabel[0].label,
        category_id: calendarLabel[0].value,
        guests,
        location,
        description: desc
      }
    }
    dispatch(addEvent(obj))
    refetchEvents()
    handleAddEventSidebar()
    toast.success('Event Added')
  }

  const handleResetInputValues = () => {
    dispatch(selectEvent({}))
    setValue('title', '')
    setAllDay(false)
    setUrl('')
    setLocation('')
    setDesc('')
    setGuests([])
    setCalendarLabel(options.length ? [options[0]] : [])
    setStartPicker(new Date())
    setEndPicker(new Date())
  }

  const handleSelectedEvent = () => {
    if (!isObjEmpty(selectedEvent)) {
      const categoryId = selectedEvent.extendedProps.category_id
      const calendar = selectedEvent.extendedProps.calendar

      const resolveLabel = () => {
        const match = options.find(o => o.value === categoryId)
        if (match) return match
        if (calendar) {
          return { value: categoryId, label: calendar, color: 'primary' }
        }
        return options.length ? options[0] : null
      }

      setValue('title', selectedEvent.title || getValues('title'))
      setAllDay(selectedEvent.allDay || allDay)
      setUrl(selectedEvent.url || url)
      setLocation(selectedEvent.extendedProps.location || location)
      setDesc(selectedEvent.extendedProps.description || desc)
      setGuests(
        (selectedEvent.extendedProps.guests || []).map(g => ({
          value: g.id,
          label: g.fullName,
          avatar: userOptions.find(u => u.value === g.id)?.avatar
        }))
      )
      setStartPicker(new Date(selectedEvent.start))
      setEndPicker(selectedEvent.allDay ? new Date(selectedEvent.start) : new Date(selectedEvent.end))
      const label = resolveLabel()
      setCalendarLabel(label ? [label] : [])
    } else {
      setCalendarLabel(options.length ? [options[0]] : [])
    }
  }

  const updateEventInCalendar = (updatedEventData, propsToUpdate, extendedPropsToUpdate) => {
    const existingEvent = calendarApi.getEventById(updatedEventData.id)
    if (!existingEvent) return

    for (let index = 0; index < propsToUpdate.length; index++) {
      const propName = propsToUpdate[index]
      existingEvent.setProp(propName, updatedEventData[propName])
    }

    existingEvent.setDates(new Date(updatedEventData.start), new Date(updatedEventData.end), {
      allDay: updatedEventData.allDay
    })

    for (let index = 0; index < extendedPropsToUpdate.length; index++) {
      const propName = extendedPropsToUpdate[index]
      existingEvent.setExtendedProp(propName, updatedEventData.extendedProps[propName])
    }
  }

  const handleUpdateEvent = () => {
    if (getValues('title').length) {
      const blockReason = blockReasonForDate(startPicker) || blockReasonForDate(endPicker)
      if (blockReason) {
        toast.error(blockReason)
        return
      }
      if (!calendarLabel.length) {
        toast.error('Pick an event category first.')
        return
      }

      const eventToUpdate = {
        id: selectedEvent.id,
        title: getValues('title'),
        allDay,
        start: startPicker,
        end: endPicker,
        url,
        display: allDay === false ? 'block' : undefined,
        extendedProps: {
          location,
          description: desc,
          guests,
          calendar: calendarLabel[0].label,
          category_id: calendarLabel[0].value
        }
      }

      const propsToUpdate = ['id', 'title', 'url']
      const extendedPropsToUpdate = ['calendar', 'guests', 'location', 'description']
      dispatch(updateEvent(eventToUpdate))
      updateEventInCalendar(eventToUpdate, propsToUpdate, extendedPropsToUpdate)

      handleAddEventSidebar()
      toast.success('Event Updated')
    } else {
      setError('title', {
        type: 'manual'
      })
    }
  }

  const removeEventInCalendar = eventId => {
    calendarApi.getEventById(eventId)?.remove()
  }

  const handleDeleteEvent = async () => {
    const eventId = selectedEvent.id

    // Instant, optimistic removal so this doesn't sit waiting on a network
    // round trip to feel responsive - removeEvent() below is still the
    // real source of truth and re-syncs store.events from the server
    // either way, so this can't leave the calendar showing something the
    // backend disagrees with: on success it's a no-op (the event's already
    // gone from both), on failure the catch below re-fetches and this
    // optimistic removal gets corrected.
    removeEventInCalendar(eventId)
    handleAddEventSidebar()

    try {
      await dispatch(removeEvent(eventId)).unwrap()
      toast.success('Event removed')
    } catch (err) {
      toast.error(err?.message || 'Failed to delete event')
      dispatch(fetchEvents())
    }
  }

  const EventActions = () => {
    if (isObjEmpty(selectedEvent) || (!isObjEmpty(selectedEvent) && !selectedEvent.title.length)) {
      return (
        <Fragment>
          <Button className='me-1' type='submit' color='primary'>
            Add
          </Button>
          <Button color='secondary' type='reset' onClick={handleAddEventSidebar} outline>
            Cancel
          </Button>
        </Fragment>
      )
    } else {
      return (
        <Fragment>
          <Button className='me-1' color='primary' onClick={handleUpdateEvent}>
            Update
          </Button>
          <Button color='danger' onClick={handleDeleteEvent} outline>
            Delete
          </Button>
        </Fragment>
      )
    }
  }

  return (
    <Modal isOpen={open} centered size='xl' toggle={handleAddEventSidebar} onOpened={handleSelectedEvent} onClosed={handleResetInputValues}>
      <div className='modal-header d-flex align-items-center justify-content-between'>
        <h5 className='modal-title'>
          {selectedEvent && selectedEvent.title && selectedEvent.title.length ? 'Update' : 'Add'} Event
        </h5>
        <X className='fw-normal cursor-pointer' size={16} onClick={handleAddEventSidebar} />
      </div>
      <Form
        onSubmit={handleSubmit(data => {
          if (data.title.length) {
            if (isObjEmpty(errors)) {
              if (isObjEmpty(selectedEvent) || (!isObjEmpty(selectedEvent) && !selectedEvent.title.length)) {
                handleAddEvent()
              } else {
                handleUpdateEvent()
              }
              handleAddEventSidebar()
            }
          } else {
            setError('title', {
              type: 'manual'
            })
          }
        })}
      >
        <ModalBody style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className='mb-1'>
              <Label className='form-label' for='title'>
                Title <span className='text-danger'>*</span>
              </Label>
              <Controller
                name='title'
                control={control}
                render={({ field }) => (
                  <Input id='title' placeholder='Title' invalid={errors.title && true} {...field} />
                )}
              />
            </div>

            <div className='mb-1'>
              <Label className='form-label' for='label'>
                Label
              </Label>
              {options.length ? (
                <Select
                  id='label'
                  value={calendarLabel}
                  options={options}
                  theme={selectThemeColors}
                  className='react-select'
                  classNamePrefix='select'
                  isClearable={false}
                  onChange={data => setCalendarLabel([data])}
                  components={{
                    Option: OptionComponent
                  }}
                />
              ) : (
                <p className='text-muted small mb-0'>
                  No event categories yet - add one under <Link to='/event-category'>Settings &rarr; Event Categories</Link>.
                </p>
              )}
            </div>

            <div className='mb-1'>
              <Label className='form-label' for='startDate'>
                Start Date
              </Label>
              <Flatpickr
                required
                id='startDate'
                name='startDate'
                className='form-control'
                onChange={date => setStartPicker(date[0])}
                value={startPicker}
                options={{
                  enableTime: allDay === false,
                  dateFormat: 'Y-m-d H:i',
                  disable: [...holidayDates, isWeekend]
                }}
              />
            </div>

            <div className='mb-1'>
              <Label className='form-label' for='endDate'>
                End Date
              </Label>
              <Flatpickr
                required
                id='endDate'
                name='endDate'
                className='form-control'
                onChange={date => setEndPicker(date[0])}
                value={endPicker}
                options={{
                  enableTime: allDay === false,
                  dateFormat: 'Y-m-d H:i',
                  disable: [...holidayDates, isWeekend]
                }}
              />
            </div>

            <div className='form-switch mb-1'>
              <Input
                id='allDay'
                type='switch'
                className='me-1'
                checked={allDay}
                name='customSwitch'
                onChange={e => setAllDay(e.target.checked)}
              />
              <Label className='form-label' for='allDay'>
                All Day
              </Label>
            </div>

            <div className='mb-1'>
              <Label className='form-label' for='eventURL'>
                Event URL
              </Label>
              <Input
                type='url'
                id='eventURL'
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder='https://www.google.com'
              />
            </div>

            <div className='mb-1'>
              <Label className='form-label' for='guests'>
                Guests
              </Label>
              <Select
                isMulti
                id='guests'
                className='react-select'
                classNamePrefix='select'
                isClearable={false}
                options={userOptions}
                theme={selectThemeColors}
                value={guests.length ? guests : null}
                onChange={data => setGuests(data ? [...data] : [])}
                components={{
                  Option: GuestsComponent
                }}
              />
            </div>

            <div className='mb-1'>
              <Label className='form-label' for='location'>
                Location
              </Label>
              <Input id='location' value={location} onChange={e => setLocation(e.target.value)} placeholder='Office' />
            </div>

          <div className='mb-1'>
            <Label className='form-label' for='description'>
              Description
            </Label>
            <Input
              type='textarea'
              name='text'
              id='description'
              rows='3'
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder='Description'
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <EventActions />
        </ModalFooter>
      </Form>
    </Modal>
  )
}

export default AddEventSidebar
