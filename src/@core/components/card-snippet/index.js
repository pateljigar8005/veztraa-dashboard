import { Fragment, useState } from 'react'
import PropTypes from 'prop-types'
import { Code } from 'react-feather'
import { Card, CardHeader, CardBody, CardTitle, Collapse } from 'reactstrap'

const CardSnippet = props => {
  const { title, children, noBody, code, iconCode } = props

  const [isOpen, setIsOpen] = useState(false)

  const IconCode = iconCode ? iconCode : <Code size={15} />

  const toggle = () => setIsOpen(!isOpen)

  const Wrapper = noBody ? Fragment : CardBody

  return (
    <Card className='card-snippet'>
      <CardHeader>
        <CardTitle tag='h4'>{title}</CardTitle>
        <div className='views cursor-pointer' onClick={toggle}>
          {IconCode}
        </div>
      </CardHeader>
      <Wrapper>{children}</Wrapper>
      <Collapse isOpen={isOpen}>
        <CardBody>{code}</CardBody>
      </Collapse>
    </Card>
  )
}

export default CardSnippet

CardSnippet.propTypes = {
  code: PropTypes.node,
  noBody: PropTypes.bool,
  children: PropTypes.any,
  iconCode: PropTypes.node,
  className: PropTypes.string,
  title: PropTypes.string.isRequired
}