import Avatar from '@components/avatar'
import { Table, Card } from 'reactstrap'
import { Monitor, Coffee, Watch, TrendingUp, TrendingDown } from 'react-feather'
import starIcon from '@src/assets/images/icons/star.svg'
import bookIcon from '@src/assets/images/icons/book.svg'
import brushIcon from '@src/assets/images/icons/brush.svg'
import rocketIcon from '@src/assets/images/icons/rocket.svg'
import toolboxIcon from '@src/assets/images/icons/toolbox.svg'
import speakerIcon from '@src/assets/images/icons/speaker.svg'
import parachuteIcon from '@src/assets/images/icons/parachute.svg'

const CompanyTable = () => {
  const data = [
    {
      img: toolboxIcon,
      name: 'Dixons',
      email: 'meguc@ruj.io',
      icon: <Monitor size={18} />,
      category: 'Technology',
      views: '23.4k',
      time: '24 hours',
      revenue: '891.2',
      sales: '68'
    },
    {
      img: parachuteIcon,
      name: 'Motels',
      email: 'vecav@hodzi.co.uk',
      icon: <Coffee size={18} />,
      category: 'Grocery',
      views: '78k',
      time: '2 days',
      revenue: '668.51',
      sales: '97',
      salesUp: true
    },
    {
      img: brushIcon,
      name: 'Zipcar',
      email: 'davcilse@is.gov',
      icon: <Watch size={18} />,
      category: 'Fashion',
      views: '162',
      time: '5 days',
      revenue: '522.29',
      sales: '62',
      salesUp: true
    },
    {
      img: starIcon,
      name: 'Owning',
      email: 'us@cuhil.gov',
      icon: <Monitor size={18} />,
      category: 'Technology',
      views: '214',
      time: '24 hour',
      revenue: '291.01',
      sales: '88',
      salesUp: true
    },
    {
      img: bookIcon,
      name: 'Cafés',
      email: 'pudais@jife.com',
      icon: <Coffee size={18} />,
      category: 'Grocery',
      views: '208',
      time: '1 week',
      revenue: '783.93',
      sales: '16'
    },
    {
      img: rocketIcon,
      name: 'Kmart',
      email: 'bipri@cawiw.com',
      icon: <Watch size={18} />,
      category: 'Fashion',
      views: '990',
      time: '1 month',
      revenue: '780.05',
      sales: '78',
      salesUp: true
    },
    {
      img: speakerIcon,
      name: 'Payers',
      email: 'luk@izug.io',
      icon: <Watch size={18} />,
      category: 'Fashion',
      views: '12.9k',
      time: '12 hours',
      revenue: '531.49',
      sales: '42',
      salesUp: true
    }
  ]
  const colorsArr = {
    Technology: 'light-primary',
    Grocery: 'light-success',
    Fashion: 'light-warning'
  }

  const renderData = () => {
    return data.map(col => {
      const IconTag = col.salesUp ? (
        <TrendingUp size={15} className='text-success' />
      ) : (
        <TrendingDown size={15} className='text-danger' />
      )

      return (
        <tr key={col.name}>
          <td>
            <div className='d-flex align-items-center'>
              <div className='avatar rounded'>
                <div className='avatar-content'>
                  <img src={col.img} alt={col.name} />
                </div>
              </div>
              <div className='ms-1'>
                <div className='fw-bolder'>{col.name}</div>
                <div className='font-small-2 text-muted'>{col.email}</div>
              </div>
            </div>
          </td>
          <td>
            <div className='d-flex align-items-center'>
              <div className='avatar rounded'>
                <div className='avatar-content'>{col.icon}</div>
              </div>
              <div className='ms-1'>
                <div className='fw-bolder'>{col.category}</div>
                <div className='font-small-2 text-muted'>{col.time}</div>
              </div>
            </div>
          </td>
          <td>
            <span className={`badge rounded-pill ${colorsArr[col.category]}`}>{col.views}</span>
          </td>
          <td>
            <div className='d-flex align-items-center'>
              {IconTag}
              <span className='ms-50'>{col.sales}%</span>
            </div>
          </td>
          <td>
            <span className='fw-bolder'>${col.revenue}</span>
          </td>
        </tr>
      )
    })
  }

  return (
    <Card className='card-company-table'>
      <Table responsive>
        <thead>
          <tr>
            <th>Company</th>
            <th>Category</th>
            <th>Views</th>
            <th>Sales</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>{renderData()}</tbody>
      </Table>
    </Card>
  )
}

export default CompanyTable