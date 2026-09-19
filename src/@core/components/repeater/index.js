import PropTypes from 'prop-types'

const Repeater = props => {
  const { count, tag, children, ...rest } = props

  const Tag = tag

  const items = []

  for (let i = 0; i < count; i++) {
    items.push(children(i))
  }

  return <Tag {...rest}>{items}</Tag>
}

Repeater.propTypes = {
  count: PropTypes.number.isRequired,
  tag: PropTypes.string.isRequired
}

Repeater.defaultProps = {
  tag: 'div'
}

export default Repeater