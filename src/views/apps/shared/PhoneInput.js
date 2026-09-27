import { useMemo } from 'react'
import Select, { components } from 'react-select'
import { Input } from 'reactstrap'
import { selectThemeColors } from '@utils'
import { countries, isoToFlagEmoji, parsePhoneValue, buildPhoneValue } from './countryDialCodes'

const countryOptions = countries.map(country => ({ value: country.iso2, label: country.name, country }))

const Option = props => {
  const { country } = props.data
  return (
    <components.Option {...props}>
      <span className='me-50' style={{ fontSize: '1.1rem' }}>
        {isoToFlagEmoji(country.iso2)}
      </span>
      <span>{country.name}</span>
      <span className='text-muted ms-50'>+{country.dialCode}</span>
    </components.Option>
  )
}

const SingleValue = props => {
  const { country } = props.data
  return (
    <components.SingleValue {...props}>
      <span className='me-50' style={{ fontSize: '1.1rem' }}>
        {isoToFlagEmoji(country.iso2)}
      </span>
      <span>+{country.dialCode}</span>
    </components.SingleValue>
  )
}

const selectStyles = {
  control: base => ({ ...base, minWidth: 118, cursor: 'pointer' }),
  menu: base => ({ ...base, minWidth: 240, zIndex: 20 }),
  valueContainer: base => ({ ...base, flexWrap: 'nowrap' })
}

// Shared phone number input: a searchable country/dial-code select next to a plain
// number field. `value`/`onChange` deal in one combined string, e.g. "+91 9876543210",
// so it drops into a react-hook-form Controller the same way a plain <Input> did.
const PhoneInput = ({ id, value, onChange, invalid, placeholder = 'Phone number', disabled }) => {
  const { country, number } = useMemo(() => parsePhoneValue(value), [value])
  const selectedOption = countryOptions.find(option => option.value === country.iso2)

  const handleCountryChange = option => {
    onChange(buildPhoneValue(option.country, number))
  }

  const handleNumberChange = e => {
    onChange(buildPhoneValue(country, e.target.value))
  }

  return (
    <div className='d-flex' style={{ gap: '0.5rem' }}>
      <Select
        inputId={id ? `${id}-country` : undefined}
        className='react-select flex-shrink-0'
        classNamePrefix='select'
        theme={selectThemeColors}
        options={countryOptions}
        value={selectedOption}
        onChange={handleCountryChange}
        components={{ Option, SingleValue }}
        styles={selectStyles}
        isSearchable
        isDisabled={disabled}
        placeholder='Search'
        aria-label='Country code'
      />
      <Input
        id={id}
        type='tel'
        className='flex-grow-1'
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        invalid={invalid}
        disabled={disabled}
      />
    </div>
  )
}

export default PhoneInput
