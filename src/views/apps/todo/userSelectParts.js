import { components } from 'react-select'
import getInitials from '../shared/getInitials'

// Picture, or an initials circle when the user has none.
// onDark: on the theme's dark multi-select chips the initials circle is
// white so it stays visible.
const UserPicture = ({ data, size = 24, onDark = false }) =>
  data.img ? (
    <img className='d-block rounded-circle flex-shrink-0' src={data.img} height={size} width={size} alt={data.label} style={{ objectFit: 'cover' }} />
  ) : (
    <span
      className={`d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bolder ${
        onDark ? 'bg-white text-dark' : 'bg-light-primary text-primary'
      }`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {getInitials(data.label)}
    </span>
  )

// react-select parts that show each user's picture: in the dropdown list,
// and on the chips of a multi-select (e.g. Assign To).
export const UserOption = props => (
  <components.Option {...props}>
    <div className='d-flex align-items-center' style={{ gap: '0.5rem' }}>
      <UserPicture data={props.data} />
      <span>{props.data.label}</span>
    </div>
  </components.Option>
)

// The theme's chip label is a plain text box; with a picture inside, the
// name sat low - centre both on one line.
export const UserMultiValueLabel = props => (
  <components.MultiValueLabel
    {...props}
    innerProps={{ ...props.innerProps, style: { ...props.innerProps?.style, display: 'flex', alignItems: 'center', lineHeight: 1 } }}
  >
    <span className='d-inline-flex align-items-center' style={{ gap: '0.4rem', lineHeight: 1 }}>
      <UserPicture data={props.data} size={18} onDark />
      {props.data.label}
    </span>
  </components.MultiValueLabel>
)

export const userSelectComponents = { Option: UserOption, MultiValueLabel: UserMultiValueLabel }
