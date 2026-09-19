import Flatpickr from 'react-flatpickr'
import classnames from 'classnames'
import { toDateOnly } from '@utils'
import '@styles/react/libs/flatpickr/flatpickr.scss'

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