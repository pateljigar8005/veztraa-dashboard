import { Fragment, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import UiLoader from '@components/ui-loader'
import { ChevronDown, RotateCw, X } from 'react-feather'
import { Card, CardHeader, CardTitle, Collapse } from 'reactstrap'

const CardActions = props => {
  const { title, actions, children, collapseIcon, reloadIcon, removeIcon, endReload } = props

  const [reload, setReload] = useState(false)
  const [collapse, setCollapse] = useState(true)
  const [visibility, setVisibility] = useState(true)

  const Icons = {
    collapse: collapseIcon ? collapseIcon : ChevronDown,
    remove: removeIcon ? removeIcon : X,
    reload: reloadIcon ? reloadIcon : RotateCw
  }

  const callAction = action => {
    switch (action) {
      case 'collapse':
        return setCollapse(!collapse)
      case 'remove':
        return setVisibility(false)
      case 'reload':
        return setReload(true)
      default:
    }
  }

  const renderIcons = () => {

    if (Array.isArray(actions)) {
      return actions.map((action, i) => {
        const Tag = Icons[action]
        return (
          <Tag
            key={i}
            className={classnames('cursor-pointer', {
              'me-50': i < actions.length - 1
            })}
            size={15}
            onClick={() => callAction(action)}
          />
        )
      })
    } else {
      const Tag = Icons[actions]
      return <Tag className='cursor-pointer' size={15} onClick={() => callAction(actions)} />
    }
  }

  const removeReload = () => {
    setReload(false)
  }

  useEffect(() => {
    if (reload) {
      endReload(removeReload)
    }
  })

  const CollapseWrapper = actions === 'collapse' || actions.includes('collapse') ? Collapse : Fragment

  const BlockUiWrapper = actions === 'reload' || actions.includes('reload') ? UiLoader : Fragment

  return (
    <BlockUiWrapper
      {...(actions === 'reload' || actions.includes('reload')
        ? {
            blocking: reload
          }
        : {})}
    >
      <Card
        className={classnames('card-action', {
          'd-none': !visibility
        })}
      >
        <CardHeader>
          <CardTitle tag='h4'>{title}</CardTitle>
          <div className='action-icons'>{renderIcons()}</div>
        </CardHeader>
        <CollapseWrapper {...(actions === 'collapse' || actions.includes('collapse') ? { isOpen: collapse } : {})}>
          {children}
        </CollapseWrapper>
      </Card>
    </BlockUiWrapper>
  )
}

export default CardActions

CardActions.propTypes = {
  removeIcon: PropTypes.any,
  reloadIcon: PropTypes.any,
  collapseIcon: PropTypes.any,
  title: PropTypes.string.isRequired,
  actions: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]).isRequired,
  endReload(props) {
    if (
      (props['actions'] === 'reload' && props['endReload'] === undefined) ||
      (props['actions'].includes('reload') && props['endReload'] === undefined)
    ) {
      return new Error('Please provide a function to end reload!')
    }
  }
}