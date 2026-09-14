// ** React Imports
import { Outlet } from 'react-router-dom'

// ** Core Layout Import
// !Do not remove the Layout import
import Layout from '@layouts/VerticalLayout'

// ** Menu Items Array
import navigation from '@src/navigation/vertical'

// ** Utils
import { filterNavByPermissions } from '@src/utility/navPermissions'
import { useSyncedUserData } from '@src/utility/hooks/useSyncedUserData'

const VerticalLayout = props => {
  // const [menuData, setMenuData] = useState([])

  // ** For ServerSide navigation
  // useEffect(() => {
  //   axios.get(URL).then(response => setMenuData(response.data))
  // }, [])

  const userData = useSyncedUserData()

  const menuData = filterNavByPermissions(navigation, userData)

  return (
    <Layout menuData={menuData} {...props}>
      <Outlet />
    </Layout>
  )
}

export default VerticalLayout
