// ** Third Party Components
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// Shared "are you sure?" prompt for every list page's Delete action, so a
// stray click can never delete something outright. `onConfirm` only runs if
// the user actually confirms.
export const confirmDelete = ({
  title = 'Are you sure?',
  text = "You won't be able to revert this!",
  confirmButtonText = 'Yes, delete it!',
  onConfirm
}) => {
  MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-outline-secondary ms-1'
    },
    buttonsStyling: false
  }).then(result => {
    if (result.isConfirmed) {
      onConfirm()
    }
  })
}
