// ** React Imports
import { Fragment, useState } from 'react'

// ** Custom Components
import Avatar from '@components/avatar'

// ** Third Party Components
import { X } from 'react-feather'
import toast from 'react-hot-toast'
import Flatpickr from 'react-flatpickr'
import Select, { components } from 'react-select' // eslint-disable-line
import { useForm, Controller } from 'react-hook-form'

// ** Reactstrap Imports
import { Button, Modal, ModalBody, ModalFooter, Label, Input, Form } from 'reactstrap'

// ** Utils
import { selectThemeColors, isObjEmpty, toDateOnly } from '@utils'

// ** Avatar Images
import img1 from '@src/assets/images/avatars/1-small.png'
import img2 from '@src/assets/images/avatars/3-small.png'
import img3 from '@src/assets/images/avatars/5-small.png'
import img4 from '@src/assets/images/avatars/7-small.png'
import img5 from '@src/assets/images/avatars/9-small.png'
import img6 from '@src/assets/images/avatars/11-small.png'

// ** Styles Imports
import '@styles/react/libs/react-select/_react-select.scss'
import '@styles/react/libs/flatpickr/flatpickr.scss'

const AddEventSidebar = props => {
  // ** Props
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
    calendarsColor,
    handleAddEventSidebar,
    holidayDates,
    getHolidayName,
    isWeekend
  } = props

  // ** Vars & Hooks
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

  // ** States
  const [url, setUrl] = useState('')
  const [desc, setDesc] = useState('')
  const [guests, setGuests] = useState({})
  const [allDay, setAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [endPicker, setEndPicker] = useState(new Date())
  const [startPicker, setStartPicker] = useState(new Date())
  const [calendarLabel, setCalendarLabel] = useState([{ value: 'Business', label: 'Business', color: 'primary' }])

  // ** Select Options
  const options = [
    { value: 'Business', label: 'Business', color: 'primary' },
    { value: 'Personal', label: 'Personal', color: 'danger' },
    { value: 'Family', label: 'Family', color: 'warning' },
    { value: 'Holiday', label: 'Holiday', color: 'success' },
    { value: 'ETC', label: 'ETC', color: 'info' }
  ]

  const guestsOptions = [
    { value: 'Donna Frank', label: 'Donna Frank', avatar: img1 },
    { value: 'Jane Foster', label: 'Jane Foster', avatar: img2 },
    { value: 'Gabrielle Robertson', label: 'Gabrielle Robertson', avatar: img3 },
    { value: 'Lori Spears', label: 'Lori Spears', avatar: img4 },
    { value: 'Sandy Vega', label: 'Sandy Vega', avatar: img5 },
    { value: 'Cheryl May', label: 'Cheryl May', avatar: img6 }
  ]

  // ** Custom select components
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
          <Avatar className='my-0 me-1' size='sm' img={data.avatar} />
          <div>{data.label}</div>
        </div>
      </components.Option>
    )
  }

  // ** Company-wide holidays and weekend days (see the Holidays and Company
  // Settings modules) - this form's own Start/End Date pickers used to have
  // no awareness of either at all, unlike the Calendar's own click-to-create
  // (see Calendar.js's dateClick), which is how an event could still end up
  // on a blocked date despite that check existing. Checked again here at
  // submit time (not just via the pickers' own `disable` option below) since
  // a date can still be typed directly into a Flatpickr text input.
  const blockReasonForDate = date => {
    if (!date) return null
    const holidayName = getHolidayName(toDateOnly(date))
    if (holidayName) return `${holidayName} - no events can be added on a holiday`
    if (isWeekend(date)) return 'Weekend - no events can be added on this date'
    return null
  }

  // ** Adds New Event
  const handleAddEvent = () => {
    const blockReason = blockReasonForDate(startPicker) || blockReasonForDate(endPicker)
    if (blockReason) {
      toast.error(blockReason)
      return
    }

    const obj = {
      title: getValues('title'),
      start: startPicker,
      end: endPicker,
      allDay,
      display: 'block',
      extendedProps: {
        calendar: calendarLabel[0].label,
        url: url.length ? url : undefined,
        guests: guests.length ? guests : undefined,
        location: location.length ? location : undefined,
        desc: desc.length ? desc : undefined
      }
    }
    dispatch(addEvent(obj))
    refetchEvents()
    handleAddEventSidebar()
    toast.success('Event Added')
  }

  // ** Reset Input Values on Close
  const handleResetInputValues = () => {
    dispatch(selectEvent({}))
    setValue('title', '')
    setAllDay(false)
    setUrl('')
    setLocation('')
    setDesc('')
    setGuests({})
    setCalendarLabel([{ value: 'Business', label: 'Business', color: 'primary' }])
    setStartPicker(new Date())
    setEndPicker(new Date())
  }

  // ** Set sidebar fields
  const handleSelectedEvent = () => {
    if (!isObjEmpty(selectedEvent)) {
      const calendar = selectedEvent.extendedProps.calendar

      const resolveLabel = () => {
        if (calendar.length) {
          return { label: calendar, value: calendar, color: calendarsColor[calendar] }
        } else {
          return { value: 'Business', label: 'Business', color: 'primary' }
        }
      }
      setValue('title', selectedEvent.title || getValues('title'))
      setAllDay(selectedEvent.allDay || allDay)
      setUrl(selectedEvent.url || url)
      setLocation(selectedEvent.extendedProps.location || location)
      setDesc(selectedEvent.extendedProps.description || desc)
      setGuests(selectedEvent.extendedProps.guests || guests)
      setStartPicker(new Date(selectedEvent.start))
      setEndPicker(selectedEvent.allDay ? new Date(selectedEvent.start) : new Date(selectedEvent.end))
      setCalendarLabel([resolveLabel()])
    }
  }

  // ** (UI) updateEventInCalendar
  const updateEventInCalendar = (updatedEventData, propsToUpdate, extendedPropsToUpdate) => {
    const existingEvent = calendarApi.getEventById(updatedEventData.id)

    // ** Set event properties except date related
    // ? Docs: https://fullcalendar.io/docs/Event-setProp
    // ** dateRelatedProps => ['start', 'end', 'allDay']
    // ** eslint-disable-next-line no-plusplus
    for (let index = 0; index < propsToUpdate.length; index++) {
      const propName = propsToUpdate[index]
      existingEvent.setProp(propName, updatedEventData[propName])
    }

    // ** Set date related props
    // ? Docs: https://fullcalendar.io/docs/Event-setDates
    existingEvent.setDates(new Date(updatedEventData.start), new Date(updatedEventData.end), {
      allDay: updatedEventData.allDay
    })

    // ** Set event's extendedProps
    // ? Docs: https://fullcalendar.io/docs/Event-setExtendedProp
    // ** eslint-disable-next-line no-plusplus
    for (let index = 0; index < extendedPropsToUpdate.length; index++) {
      const propName = extendedPropsToUpdate[index]
      existingEvent.setExtendedProp(propName, updatedEventData.extendedProps[propName])
    }
  }

  // ** Updates Event in Store
  const handleUpdateEvent = () => {
    if (getValues('title').length) {
      const blockReason = blockReasonForDate(startPicker) || blockReasonForDate(endPicker)
      if (blockReason) {
        toast.error(blockReason)
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
          calendar: calendarLabel[0].label
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

  // ** (UI) removeEventInCalendar
  const removeEventInCalendar = eventId => {
    calendarApi.getEventById(eventId).remove()
  }

  const handleDeleteEvent = () => {
    dispatch(removeEvent(selectedEvent.id))
    removeEventInCalendar(selectedEvent.id)
    handleAddEventSidebar()
    toast.error('Event Removed')
  }

  // ** Event Action buttons
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
                  // Same holiday/weekend blocking as the Calendar's own
                  // click-to-create (see Calendar.js's dayCellClassNames) -
                  // this picker had none at all before, which is how an
                  // event could still be added on a blocked date via this
                  // form even though clicking the day cell directly refused.
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
                // tag={Flatpickr}
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
                options={guestsOptions}
                theme={selectThemeColors}
                value={guests.length ? [...guests] : null}
                onChange={data => setGuests([...data])}
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
