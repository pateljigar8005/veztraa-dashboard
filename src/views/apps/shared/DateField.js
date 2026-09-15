// ** Third Party Components
import Flatpickr from 'react-flatpickr'
import classnames from 'classnames'

// ** Utils
import { toDateOnly } from '@utils'

// ** Styles
import '@styles/react/libs/flatpickr/flatpickr.scss'

// ** Thin Flatpickr wrapper used everywhere a single date-only field is
// needed, so every date picker in the app looks and behaves the same way
// instead of mixing native <input type='date'> with Flatpickr ad hoc.
// `value`/`onChange` both work with plain 'YYYY-MM-DD' strings - the only
// format any date-only field in this app stores or sends.
const DateField = ({ id, value, onChange, invalid, className, options, ...rest }) => (
  <Flatpickr
    id={id}
    className={classnames('form-control', { 'is-invalid': invalid }, className)}
    value={value || ''}
    onChange={dates => onChange(toDateOnly(dates[0]))}
    options={{ dateFormat: 'Y-m-d', ...options }}
    {...rest}
  />
)

export default DateField
