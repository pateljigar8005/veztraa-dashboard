import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import classnames from 'classnames'
import { Settings } from 'react-feather'
import { Card, CardBody, Button, Input, Label } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'

const taskFilters = [{ label: 'To-Do', className: 'form-check-info' }]

const SidebarLeft = props => {
  const { handleAddEventSidebar, toggleSidebar, updateFilter, updateAllFilters, toggleTaskFilter, store, dispatch } = props

  const handleAddEventClick = () => {
    toggleSidebar(false)
    handleAddEventSidebar()
  }

  return (
    <Fragment>
      <Card className='sidebar-wrapper shadow-none'>
        <CardBody className='card-body d-flex justify-content-center my-sm-0 mb-3'>
          <Button color='primary' block onClick={handleAddEventClick}>
            <span className='align-middle'>Add Event</span>
          </Button>
        </CardBody>
        <CardBody>
          <div className='d-flex align-items-center justify-content-between mb-1'>
            <h5 className='section-label mb-0'>
              <span className='align-middle'>Filter</span>
            </h5>
            {currentUserCan('/event-category', 'edit') && (
              <Link to='/event-category' title='Manage Event Categories'>
                <Settings size={14} />
              </Link>
            )}
          </div>
          <div className='form-check mb-1'>
            <Input
              id='view-all'
              type='checkbox'
              label='View All'
              className='select-all'
              checked={store.selectedCalendars.length === store.eventCategories.length}
              onChange={e => dispatch(updateAllFilters(e.target.checked))}
            />
            <Label className='form-check-label' for='view-all'>
              View All
            </Label>
          </div>
          <div className='calendar-events-filter'>
            {store.eventCategories.length ? (
              store.eventCategories.map(category => (
                <div
                  key={`${category.name}-key`}
                  className={classnames('form-check', {
                    [`form-check-${category.color} mb-1`]: true
                  })}
                >
                  <Input
                    type='checkbox'
                    key={category.name}
                    label={category.name}
                    className='input-filter'
                    id={`${category.name}-event`}
                    checked={store.selectedCalendars.includes(category.name)}
                    onChange={() => {
                      dispatch(updateFilter(category.name))
                    }}
                  />
                  <Label className='form-check-label' for={`${category.name}-event`}>
                    {category.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className='text-muted small mb-0'>
                No event categories yet - add one under{' '}
                <Link to='/event-category'>Settings &rarr; Event Categories</Link>.
              </p>
            )}
          </div>
        </CardBody>
        <CardBody>
          <h5 className='section-label mb-1'>
            <span className='align-middle'>Upcoming Tasks</span>
          </h5>
          <div className='calendar-events-filter'>
            {taskFilters.map(filter => (
              <div
                key={`${filter.label}-key`}
                className={classnames('form-check', {
                  [filter.className]: filter.className
                })}
              >
                <Input
                  type='checkbox'
                  key={filter.label}
                  label={filter.label}
                  className='input-filter'
                  id={`${filter.label}-event`}
                  checked={store.taskFilters.includes(filter.label)}
                  onChange={() => {
                    dispatch(toggleTaskFilter(filter.label))
                  }}
                />
                <Label className='form-check-label' for={`${filter.label}-event`}>
                  {filter.label}
                </Label>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </Fragment>
  )
}

export default SidebarLeft