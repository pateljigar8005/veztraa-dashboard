import { Fragment } from 'react'
import Table from './list/Table'

const Roles = () => {
  return (
    <Fragment>
      <h3>Roles List</h3>
      <p className='mb-2'>
        A role provides access to predefined menus and features depending on the assigned role to an administrator that
        can have access to what he needs.
      </p>
      <Table />
    </Fragment>
  )
}

export default Roles