import { useMemo } from 'react'
import classNames from 'classnames'
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

// Borderless, background-less control styles so the select reads as the left
// half of one merged field rather than a field of its own.
const selectStyles = {
  container: base => ({ ...base, minWidth: 110 }),
  control: base => ({
    ...base,
    minHeight: 'auto',
    border: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer'
  }),
  valueContainer: base => ({ ...base, flexWrap: 'nowrap', padding: '0 0.25rem' }),
  indicatorSeparator: base => ({ ...base, display: 'none' }),
  indicatorsContainer: base => ({ ...base, padding: 0 }),
  dropdownIndicator: base => ({ ...base, padding: '0 0.25rem' }),
  menu: base => ({ ...base, minWidth: 240, zIndex: 20 })
}

// Shared phone number input: a searchable country/dial-code select fused with a plain
// number field into a single bordered control. `value`/`onChange` deal in one combined
// string, e.g. "+91 9876543210", so it drops into a react-hook-form Controller the
// same way a plain <Input> did.
const PhoneInput = ({ id, value, onChange, invalid, placeholder = 'Phone number', disabled }) => {
  const { country, number } = useMemo(() => parsePhoneValue(value), [value])
  const selectedOption = countryOptions.find(option => option.value === country.iso2)

  const handleCountryChange = option => {
    onChange(buildPhoneValue(option.country, number))
  }

  const handleNumberChange = e => {
    onChange(buildPhoneValue(country, e.target.value.replace(/\D/g, '')))
  }

  return (
    <div
      className={classNames('form-control d-flex align-items-center p-0', {
        'is-invalid': invalid,
        disabled
      })}
    >
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
      <div className='border-start' style={{ alignSelf: 'stretch', margin: '0.4rem 0' }} />
      <Input
        id={id}
        type='tel'
        className='flex-grow-1 border-0'
        style={{ boxShadow: 'none' }}
        value={number}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  )
}

export default PhoneInput
