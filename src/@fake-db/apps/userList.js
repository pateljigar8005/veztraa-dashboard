import mock from '../mock'

// ** Utils
import { paginateArray } from '../utils'

// Avatars Imports
import avatar1 from '@src/assets/images/avatars/1.png'
import avatar2 from '@src/assets/images/avatars/2.png'
import avatar3 from '@src/assets/images/avatars/3.png'
import avatar4 from '@src/assets/images/avatars/4.png'
import avatar5 from '@src/assets/images/avatars/5.png'
import avatar6 from '@src/assets/images/avatars/6.png'
import avatar7 from '@src/assets/images/avatars/7.png'
import avatar8 from '@src/assets/images/avatars/8.png'
import avatar9 from '@src/assets/images/avatars/9.png'
import avatar10 from '@src/assets/images/avatars/10.png'

const data = {
  users: [
    {
      id: 1,
      fullName: 'Galen Slixby',
      role: 'editor',
      username: 'gslixby0',
      contact: '(479) 232-9151',
      email: 'gslixby0@abc.net.au',
      status: 'inactive',
      avatar: '',
      avatarColor: 'light-primary'
    },
    {
      id: 2,
      fullName: 'Halsey Redmore',
      role: 'author',
      username: 'hredmore1',
      contact: '(472) 607-9137',
      email: 'hredmore1@imgur.com',
      status: 'pending',
      avatar: avatar10
    },
    {
      id: 3,
      fullName: 'Marjory Sicely',
      role: 'maintainer',
      username: 'msicely2',
      contact: '(321) 264-4599',
      email: 'msicely2@who.int',
      status: 'active',
      avatar: avatar1
    },
    {
      id: 4,
      fullName: 'Cyrill Risby',
      role: 'maintainer',
      username: 'crisby3',
      contact: '(923) 690-6806',
      email: 'crisby3@wordpress.com',
      status: 'inactive',
      avatar: avatar9
    },
    {
      id: 5,
      fullName: 'Maggy Hurran',
      role: 'subscriber',
      username: 'mhurran4',
      contact: '(669) 914-1078',
      email: 'mhurran4@yahoo.co.jp',
      status: 'pending',
      avatar: avatar10
    },
    {
      id: 6,
      fullName: 'Silvain Halstead',
      role: 'author',
      username: 'shalstead5',
      contact: '(958) 973-3093',
      email: 'shalstead5@shinystat.com',
      status: 'active',
      avatar: '',
      avatarColor: 'light-success'
    },
    {
      id: 7,
      fullName: 'Breena Gallemore',
      role: 'subscriber',
      username: 'bgallemore6',
      contact: '(825) 977-8152',
      email: 'bgallemore6@boston.com',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-danger'
    },
    {
      id: 8,
      fullName: 'Kathryne Liger',
      role: 'author',
      username: 'kliger7',
      contact: '(187) 440-0934',
      email: 'kliger7@vinaora.com',
      status: 'pending',
      avatar: avatar9
    },
    {
      id: 9,
      fullName: 'Franz Scotfurth',
      role: 'subscriber',
      username: 'fscotfurth8',
      contact: '(978) 146-5443',
      email: 'fscotfurth8@dailymotion.com',
      status: 'pending',
      avatar: avatar2
    },
    {
      id: 10,
      fullName: 'Jillene Bellany',
      role: 'maintainer',
      username: 'jbellany9',
      contact: '(589) 284-6732',
      email: 'jbellany9@kickstarter.com',
      status: 'inactive',
      avatar: avatar9
    },
    {
      id: 11,
      fullName: 'Jonah Wharlton',
      role: 'subscriber',
      username: 'jwharltona',
      contact: '(176) 532-6824',
      email: 'jwharltona@oakley.com',
      status: 'inactive',
      avatar: avatar4
    },
    {
      id: 12,
      fullName: 'Seth Hallam',
      role: 'subscriber',
      username: 'shallamb',
      contact: '(234) 464-0600',
      email: 'shallamb@hugedomains.com',
      status: 'pending',
      avatar: avatar5
    },
    {
      id: 13,
      fullName: 'Yoko Pottie',
      role: 'subscriber',
      username: 'ypottiec',
      contact: '(907) 284-5083',
      email: 'ypottiec@privacy.gov.au',
      status: 'inactive',
      avatar: avatar7
    },
    {
      id: 14,
      fullName: 'Maximilianus Krause',
      role: 'author',
      username: 'mkraused',
      contact: '(167) 135-7392',
      email: 'mkraused@stanford.edu',
      status: 'active',
      avatar: avatar9
    },
    {
      id: 15,
      fullName: 'Zsazsa McCleverty',
      role: 'maintainer',
      username: 'zmcclevertye',
      contact: '(317) 409-6565',
      email: 'zmcclevertye@soundcloud.com',
      status: 'active',
      avatar: avatar2
    },
    {
      id: 16,
      fullName: 'Bentlee Emblin',
      role: 'author',
      username: 'bemblinf',
      contact: '(590) 606-1056',
      email: 'bemblinf@wired.com',
      status: 'active',
      avatar: avatar6
    },
    {
      id: 17,
      fullName: 'Brockie Myles',
      role: 'maintainer',
      username: 'bmylesg',
      contact: '(553) 225-9905',
      email: 'bmylesg@amazon.com',
      status: 'active',
      avatar: '',
      avatarColor: 'light-warning'
    },
    {
      id: 18,
      fullName: 'Bertha Biner',
      role: 'editor',
      username: 'bbinerh',
      contact: '(901) 916-9287',
      email: 'bbinerh@mozilla.com',
      status: 'active',
      avatar: avatar7
    },
    {
      id: 19,
      fullName: 'Travus Bruntjen',
      role: 'admin',
      username: 'tbruntjeni',
      contact: '(524) 586-6057',
      email: 'tbruntjeni@sitemeter.com',
      status: 'active',
      avatar: '',
      avatarColor: 'light-info'
    },
    {
      id: 20,
      fullName: 'Wesley Burland',
      role: 'editor',
      username: 'wburlandj',
      contact: '(569) 683-1292',
      email: 'wburlandj@uiuc.edu',
      status: 'inactive',
      avatar: avatar6
    },
    {
      id: 21,
      fullName: 'Selina Kyle',
      role: 'admin',
      username: 'catwomen1940',
      contact: '(829) 537-0057',
      email: 'irena.dubrovna@wayne.com',
      status: 'active',
      avatar: avatar1
    },
    {
      id: 22,
      fullName: 'Jameson Lyster',
      role: 'editor',
      username: 'jlysterl',
      contact: '(593) 624-0222',
      email: 'jlysterl@guardian.co.uk',
      status: 'inactive',
      avatar: avatar8
    },
    {
      id: 23,
      fullName: 'Kare Skitterel',
      role: 'maintainer',
      username: 'kskitterelm',
      contact: '(254) 845-4107',
      email: 'kskitterelm@washingtonpost.com',
      status: 'pending',
      avatar: avatar3
    },
    {
      id: 24,
      fullName: 'Cleavland Hatherleigh',
      role: 'admin',
      username: 'chatherleighn',
      contact: '(700) 783-7498',
      email: 'chatherleighn@washington.edu',
      status: 'pending',
      avatar: avatar2
    },
    {
      id: 25,
      fullName: 'Adeline Micco',
      role: 'admin',
      username: 'amiccoo',
      contact: '(227) 598-1841',
      email: 'amiccoo@whitehouse.gov',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-primary'
    },
    {
      id: 26,
      fullName: 'Hugh Hasson',
      role: 'admin',
      username: 'hhassonp',
      contact: '(582) 516-1324',
      email: 'hhassonp@bizjournals.com',
      status: 'inactive',
      avatar: avatar4
    },
    {
      id: 27,
      fullName: 'Germain Jacombs',
      role: 'editor',
      username: 'gjacombsq',
      contact: '(137) 467-5393',
      email: 'gjacombsq@jigsy.com',
      status: 'active',
      avatar: avatar10
    },
    {
      id: 28,
      fullName: 'Bree Kilday',
      role: 'maintainer',
      username: 'bkildayr',
      contact: '(412) 476-0854',
      email: 'bkildayr@mashable.com',
      status: 'active',
      avatar: '',
      avatarColor: 'light-success'
    },
    {
      id: 29,
      fullName: 'Candice Pinyon',
      role: 'maintainer',
      username: 'cpinyons',
      contact: '(170) 683-1520',
      email: 'cpinyons@behance.net',
      status: 'active',
      avatar: avatar7
    },
    {
      id: 30,
      fullName: 'Isabel Mallindine',
      role: 'subscriber',
      username: 'imallindinet',
      contact: '(332) 803-1983',
      email: 'imallindinet@shinystat.com',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-warning'
    },
    {
      id: 31,
      fullName: 'Gwendolyn Meineken',
      role: 'admin',
      username: 'gmeinekenu',
      contact: '(551) 379-7460',
      email: 'gmeinekenu@hc360.com',
      status: 'pending',
      avatar: avatar1
    },
    {
      id: 32,
      fullName: 'Rafaellle Snowball',
      role: 'editor',
      username: 'rsnowballv',
      contact: '(974) 829-0911',
      email: 'rsnowballv@indiegogo.com',
      status: 'pending',
      avatar: avatar5
    },
    {
      id: 33,
      fullName: 'Rochette Emer',
      role: 'admin',
      username: 'remerw',
      contact: '(841) 889-3339',
      email: 'remerw@blogtalkradio.com',
      status: 'active',
      avatar: avatar8
    },
    {
      id: 34,
      fullName: 'Ophelie Fibbens',
      role: 'subscriber',
      username: 'ofibbensx',
      contact: '(764) 885-7351',
      email: 'ofibbensx@booking.com',
      status: 'active',
      avatar: avatar4
    },
    {
      id: 35,
      fullName: 'Stephen MacGilfoyle',
      role: 'maintainer',
      username: 'smacgilfoyley',
      contact: '(350) 589-8520',
      email: 'smacgilfoyley@bigcartel.com',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-danger'
    },
    {
      id: 36,
      fullName: 'Bradan Rosebotham',
      role: 'subscriber',
      username: 'brosebothamz',
      contact: '(882) 933-2180',
      email: 'brosebothamz@tripadvisor.com',
      status: 'inactive',
      avatar: '',
      avatarColor: 'light-info'
    },
    {
      id: 37,
      fullName: 'Skip Hebblethwaite',
      role: 'admin',
      username: 'shebblethwaite10',
      contact: '(610) 343-1024',
      email: 'shebblethwaite10@arizona.edu',
      status: 'inactive',
      avatar: avatar9
    },
    {
      id: 38,
      fullName: 'Moritz Piccard',
      role: 'maintainer',
      username: 'mpiccard11',
      contact: '(365) 277-2986',
      email: 'mpiccard11@vimeo.com',
      status: 'inactive',
      avatar: avatar1
    },
    {
      id: 39,
      fullName: 'Tyne Widmore',
      role: 'subscriber',
      username: 'twidmore12',
      contact: '(531) 731-0928',
      email: 'twidmore12@bravesites.com',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-primary'
    },
    {
      id: 40,
      fullName: 'Florenza Desporte',
      role: 'author',
      username: 'fdesporte13',
      contact: '(312) 104-2638',
      email: 'fdesporte13@omniture.com',
      status: 'active',
      avatar: avatar6
    },
    {
      id: 41,
      fullName: 'Edwina Baldetti',
      role: 'maintainer',
      username: 'ebaldetti14',
      contact: '(315) 329-3578',
      email: 'ebaldetti14@theguardian.com',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-success'
    },
    {
      id: 42,
      fullName: 'Benedetto Rossiter',
      role: 'editor',
      username: 'brossiter15',
      contact: '(323) 175-6741',
      email: 'brossiter15@craigslist.org',
      status: 'inactive',
      avatar: '',
      avatarColor: 'light-danger'
    },
    {
      id: 43,
      fullName: 'Micaela McNirlan',
      role: 'admin',
      username: 'mmcnirlan16',
      contact: '(242) 952-0916',
      email: 'mmcnirlan16@hc360.com',
      status: 'inactive',
      avatar: '',
      avatarColor: 'light-warning'
    },
    {
      id: 44,
      fullName: 'Vladamir Koschek',
      role: 'author',
      username: 'vkoschek17',
      contact: '(531) 758-8335',
      email: 'vkoschek17@abc.net.au',
      status: 'active',
      avatar: '',
      avatarColor: 'light-info'
    },
    {
      id: 45,
      fullName: 'Corrie Perot',
      role: 'subscriber',
      username: 'cperot18',
      contact: '(659) 385-6808',
      email: 'cperot18@goo.ne.jp',
      status: 'pending',
      avatar: avatar3
    },
    {
      id: 46,
      fullName: 'Saunder Offner',
      role: 'maintainer',
      username: 'soffner19',
      contact: '(200) 586-2264',
      email: 'soffner19@mac.com',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-primary'
    },
    {
      id: 47,
      fullName: 'Karena Courtliff',
      role: 'admin',
      username: 'kcourtliff1a',
      contact: '(478) 199-0020',
      email: 'kcourtliff1a@bbc.co.uk',
      status: 'active',
      avatar: avatar1
    },
    {
      id: 48,
      fullName: 'Onfre Wind',
      role: 'admin',
      username: 'owind1b',
      contact: '(344) 262-7270',
      email: 'owind1b@yandex.ru',
      status: 'pending',
      avatar: '',
      avatarColor: 'light-success'
    },
    {
      id: 49,
      fullName: 'Paulie Durber',
      role: 'subscriber',
      username: 'pdurber1c',
      contact: '(694) 676-1275',
      email: 'pdurber1c@gov.uk',
      status: 'inactive',
      avatar: '',
      avatarColor: 'light-danger'
    },
    {
      id: 50,
      fullName: 'Beverlie Krabbe',
      role: 'editor',
      username: 'bkrabbe1d',
      contact: '(397) 294-5153',
      email: 'bkrabbe1d@home.pl',
      status: 'active',
      avatar: avatar9
    }
  ]
}

// GET ALL DATA
mock.onGet('/api/users/list/all-data').reply(200, data.users)

// POST: Add new user
mock.onPost('/apps/users/add-user').reply(config => {
  // Get event from post data
  const user = JSON.parse(config.data)
  const highestValue = data.users.reduce((a, b) => (a.id > b.id ? a : b)).id

  user.id = highestValue + 1

  data.users.push(user)

  return [201, { user }]
})

// GET Updated DATA
mock.onGet('/api/users/list/data').reply(config => {
  const {
    q = '',
    page = 1,
    role = null,
    perPage = 10,
    sort = 'asc',
    status = null,
    sortColumn = 'fullName'
  } = config

  /* eslint-disable  */
  const queryLowered = q.toLowerCase()

  const dataAsc = data.users.sort((a, b) => (a[sortColumn] < b[sortColumn] ? -1 : 1))

  const dataToFilter = sort === 'asc' ? dataAsc : dataAsc.reverse()

  const filteredData = dataToFilter.filter(
    user =>
      (user.email.toLowerCase().includes(queryLowered) || user.fullName.toLowerCase().includes(queryLowered)) &&
      user.role === (role || user.role) &&
      user.status === (status || user.status)
  )
  /* eslint-enable  */

  return [
    200,
    {
      total: filteredData.length,
      users: paginateArray(filteredData, perPage, page)
    }
  ]
})

// GET USER
mock.onGet('/api/users/user').reply(config => {
  const { id } = config
  const user = data.users.find(i => i.id === id)
  return [200, { user }]
})

// DELETE: Deletes User
mock.onDelete('/apps/users/delete').reply(config => {
  // Get user id from URL
  let userId = config.id

  // Convert Id to number
  userId = Number(userId)

  const userIndex = data.users.findIndex(t => t.id === userId)
  data.users.splice(userIndex, 1)

  return [200]
})
