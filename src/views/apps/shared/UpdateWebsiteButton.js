import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { RefreshCw } from 'react-feather'
import { Button, Spinner } from 'reactstrap'
import { currentUserCan } from '@src/utility/navPermissions'

// Manual "Update Website" for the Case Studies / Job Listings / Portfolio /
// Team lists. Every save already refreshes the website on its own - this is
// the backup for when that didn't go through. Needs the module's edit
// permission, same as the API route (ModulePermission).
const UpdateWebsiteButton = ({ endpoint, route }) => {
  const [busy, setBusy] = useState(false)

  if (!currentUserCan(route, 'edit')) return null

  const handleClick = () => {
    setBusy(true)
    axios
      .post(endpoint)
      .then(() => toast.success('Website updated'))
      .catch(err => toast.error(err.response?.data?.message || 'Could not update the website'))
      .finally(() => setBusy(false))
  }

  return (
    <Button color='primary' outline className='ms-1 text-nowrap' disabled={busy} onClick={handleClick}>
      {busy ? <Spinner size='sm' className='me-50' /> : <RefreshCw size={14} className='me-50' />}
      Update Website
    </Button>
  )
}

export default UpdateWebsiteButton
