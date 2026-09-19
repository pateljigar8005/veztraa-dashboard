import { Outlet } from 'react-router-dom'
import Layout from '@layouts/HorizontalLayout'
import navigation from '@src/navigation/horizontal'
import { filterNavByPermissions } from '@src/utility/navPermissions'
import { useSyncedUserData } from '@src/utility/hooks/useSyncedUserData'

const HorizontalLayout = props => {


  const userData = useSyncedUserData()

  const menuData = filterNavByPermissions(navigation, userData)

  return (
    <Layout menuData={menuData} {...props}>
      <Outlet />
    </Layout>
  )
}

export default HorizontalLayout