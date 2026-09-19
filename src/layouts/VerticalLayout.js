import { Outlet } from 'react-router-dom'
import Layout from '@layouts/VerticalLayout'
import navigation from '@src/navigation/vertical'
import { filterNavByPermissions } from '@src/utility/navPermissions'
import { useSyncedUserData } from '@src/utility/hooks/useSyncedUserData'

const VerticalLayout = props => {


  const userData = useSyncedUserData()

  const menuData = filterNavByPermissions(navigation, userData)

  return (
    <Layout menuData={menuData} {...props}>
      <Outlet />
    </Layout>
  )
}

export default VerticalLayout