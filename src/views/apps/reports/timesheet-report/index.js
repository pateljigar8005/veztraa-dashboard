// ** React Imports
import { useEffect, useState } from 'react'

// ** Third Party Components
import axios from 'axios'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import Select from 'react-select'
import DataTable from 'react-data-table-component'
import { Search, RotateCcw, Download, Clock, FileText, Folder, TrendingUp } from 'react-feather'

// ** Reactstrap Imports
import { Card, CardHeader, CardTitle, CardBody, Row, Col, Label, Button, Spinner } from 'reactstrap'

// ** Shared Components
import DateField from '../../shared/DateField'

// ** Utils
import { selectThemeColors, getUserData } from '@utils'

// ** Styles
import '@styles/react/libs/tables/react-dataTable-component.scss'

// ** Same "isAdmin" check as the Timesheet Add form (see
// TimesheetController's own ownership enforcement there) - a non-admin
// running this report always gets only their own entries back regardless
// of what this page sends, so the User filter is hidden entirely for them
// rather than shown as a pointless control.
const isAdmin = () => (getUserData()?.role || '').toLowerCase() === 'admin'

const defaultFilters = {
  date_from: '',
  date_to: '',
  users: [],
  projects: [],
  activities: []
}

const columns = [
  { name: 'Date', minWidth: '120px', sortable: true, selector: row => row.date },
  {
    name: 'User',
    minWidth: '160px',
    selector: row => row.user_name,
    cell: row => <span className='fw-bolder'>{row.user_name}</span>
  },
  { name: 'Project', minWidth: '180px', selector: row => row.project_name },
  { name: 'Activity', minWidth: '160px', selector: row => row.activity_name },
  {
    name: 'Hours',
    minWidth: '100px',
    right: true,
    sortable: true,
    selector: row => Number(row.hours),
    cell: row => <span className='fw-bolder'>{Number(row.hours).toFixed(2)}</span>
  },
  {
    name: 'Description',
    minWidth: '220px',
    selector: row => row.description,
    cell: row => <span className='text-truncate'>{row.description || '-'}</span>
  }
]

// ** A KPI tile for the summary row - same shape used across every report.
const StatCard = ({ icon: Icon, color, label, value }) => (
  <Col md={3} sm={6} className='mb-1'>
    <Card className='mb-0'>
      <CardBody className='d-flex align-items-center'>
        <div className={`avatar avatar-stats p-50 m-0 me-2 bg-light-${color}`}>
          <div className='avatar-content'>
            <Icon size={22} />
          </div>
        </div>
        <div>
          <h4 className='fw-bolder mb-0'>{value}</h4>
          <p className='card-text text-muted mb-0'>{label}</p>
        </div>
      </CardBody>
    </Card>
  </Col>
)

// ** Builds one Excel sheet from a set of timesheet rows - shared by the
// combined "Entries" sheet and each per-project sheet below.
const buildEntrySheet = entryRows => {
  const sheet = XLSX.utils.json_to_sheet(
    entryRows.map(r => ({
      Date: r.date,
      User: r.user_name,
      Project: r.project_name,
      Activity: r.activity_name,
      Hours: Number(r.hours),
      Description: r.description || ''
    }))
  )
  sheet['!cols'] = [{ wch: 12 }, { wch: 20 }, { wch: 24 }, { wch: 20 }, { wch: 10 }, { wch: 40 }]
  return sheet
}

const TimesheetReport = () => {
  // ** States
  const [filters, setFilters] = useState(defaultFilters)
  const [userOptions, setUserOptions] = useState([])
  const [projectOptions, setProjectOptions] = useState([])
  const [activityOptions, setActivityOptions] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const admin = isAdmin()

  // ** Filter option lists - the User one is only ever fetched/shown for an
  // admin (see the note on isAdmin() above).
  useEffect(() => {
    if (admin) {
      axios
        .get('/users', { params: { perPage: 100 } })
        .then(response => setUserOptions(response.data.data.users.map(u => ({ value: u.id, label: u.fullName }))))
        .catch(() => {})
    }
    axios
      .get('/projects', { params: { perPage: 100 } })
      .then(response => setProjectOptions(response.data.data.projects.map(p => ({ value: p.id, label: p.name }))))
      .catch(() => {})
    axios
      .get('/timesheet-activities', { params: { perPage: 100 } })
      .then(response => {
        const active = response.data.data.timesheetActivities.filter(a => a.is_active)
        setActivityOptions(active.map(a => ({ value: a.id, label: a.name })))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))

  const buildParams = () => {
    const params = {}
    if (filters.date_from) params.date_from = filters.date_from
    if (filters.date_to) params.date_to = filters.date_to
    return params
  }

  // ** Fully pages through ONE fixed set of filter params.
  const fetchAllPages = async params => {
    let page = 1
    let all = []
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await axios.get('/timesheets', { params: { ...params, page, perPage: 100 } })
      const { timesheets, total } = response.data.data
      all = all.concat(timesheets)
      if (timesheets.length === 0 || all.length >= total) break
      page++
    }
    return all
  }

  // ** /timesheets only supports ONE exact value per filter (see
  // Timesheet::FILTERABLE's 'eq' type - no IN-list support), so selecting
  // several users/projects/activities at once can't be expressed as a
  // single request. Instead: build every combination across whichever
  // dimensions actually have a multi-selection (an unselected dimension
  // contributes a single "no filter on this" placeholder), fire one
  // paginated fetch per combination in parallel, and concatenate - each
  // combination's rows are disjoint by construction, so there's nothing to
  // de-duplicate. Degrades to exactly one request when nothing is
  // multi-selected, same as before. A non-admin's user_id is still
  // force-scoped to themselves server-side regardless of what's sent here
  // (see TimesheetController::index()).
  const dimensionValues = (selected, key) => (selected.length ? selected.map(o => ({ [key]: o.value })) : [{}])

  const fetchAllMatching = async () => {
    const baseParams = buildParams()
    const userCombos = dimensionValues(filters.users, 'user_id')
    const projectCombos = dimensionValues(filters.projects, 'project_id')
    const activityCombos = dimensionValues(filters.activities, 'activity_id')

    const requests = []
    for (const u of userCombos) {
      for (const p of projectCombos) {
        for (const a of activityCombos) {
          requests.push(fetchAllPages({ ...baseParams, ...u, ...p, ...a }))
        }
      }
    }

    const results = await Promise.all(requests)
    return results.flat()
  }

  const handleRun = () => {
    setLoading(true)
    fetchAllMatching()
      .then(all => {
        setRows(all)
        setHasRun(true)
      })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false))
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setRows([])
    setHasRun(false)
  }

  const totalHours = rows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0)
  const distinctProjects = new Set(rows.map(r => r.project_id)).size
  const avgHoursPerEntry = rows.length ? totalHours / rows.length : 0

  // ** Summary + combined "Entries" sheet + one sheet per project that
  // actually has entries - same "categorized worksheets" shape as the
  // Invoice Report's own per-status sheets, just grouped by project here
  // since that's the natural breakdown for time logged against work.
  const handleExport = () => {
    if (!rows.length) {
      toast.error('Nothing to export - run the report first')
      return
    }

    setExporting(true)
    try {
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['Timesheet Report'],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Filters Applied'],
        ['Date From', filters.date_from || 'Any'],
        ['Date To', filters.date_to || 'Any'],
        [
          'Users',
          filters.users.length ? filters.users.map(u => u.label).join(', ') : admin ? 'Any' : getUserData()?.fullName || 'Me'
        ],
        ['Projects', filters.projects.length ? filters.projects.map(p => p.label).join(', ') : 'Any'],
        ['Activities', filters.activities.length ? filters.activities.map(a => a.label).join(', ') : 'Any'],
        [],
        ['Summary'],
        ['Total Entries', rows.length],
        ['Total Hours', totalHours.toFixed(2)],
        ['Distinct Projects', distinctProjects],
        ['Average Hours / Entry', avgHoursPerEntry.toFixed(2)]
      ])
      summarySheet['!cols'] = [{ wch: 22 }, { wch: 28 }]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
      XLSX.utils.book_append_sheet(workbook, buildEntrySheet(rows), 'Entries')

      const projectNames = [...new Set(rows.map(r => r.project_name))].sort()
      projectNames.forEach(name => {
        const projectRows = rows.filter(r => r.project_name === name)
        // Excel sheet names cap at 31 chars and reject / \ ? * [ ] :
        const sheetName = name.replace(/[/\\?*[\]:]/g, '-').slice(0, 31)
        XLSX.utils.book_append_sheet(workbook, buildEntrySheet(projectRows), sheetName)
      })

      XLSX.writeFile(workbook, `Timesheet-Report-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Report exported')
    } catch (e) {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='timesheet-report'>
      <Card>
        <CardHeader className='d-flex justify-content-between align-items-center flex-wrap'>
          <CardTitle tag='h4'>Timesheet Report</CardTitle>
          <div className='d-flex' style={{ gap: '0.5rem' }}>
            <Button color='secondary' outline onClick={handleReset} disabled={loading}>
              <RotateCcw size={14} className='me-50' />
              Reset
            </Button>
            <Button color='primary' onClick={handleRun} disabled={loading}>
              {loading ? <Spinner size='sm' className='me-50' /> : <Search size={14} className='me-50' />}
              Run Report
            </Button>
            <Button color='success' onClick={handleExport} disabled={exporting || !rows.length}>
              <Download size={14} className='me-50' />
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <h6 className='mb-1'>Date Range</h6>
          <Row>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='date_from'>
                Date From
              </Label>
              <DateField id='date_from' value={filters.date_from} onChange={v => setFilter('date_from', v)} />
            </Col>
            <Col md={3} className='mb-1'>
              <Label className='form-label' for='date_to'>
                Date To
              </Label>
              <DateField id='date_to' value={filters.date_to} onChange={v => setFilter('date_to', v)} />
            </Col>
          </Row>

          <hr />

          <h6 className='mb-1'>Team & Work</h6>
          {!admin && (
            <p className='text-muted small mb-1'>
              Showing your own timesheet entries only - only an admin can run this report across everyone.
            </p>
          )}
          <Row>
            {admin && (
              <Col md={4} className='mb-1'>
                <Label className='form-label' for='users'>
                  Users
                </Label>
                <Select
                  inputId='users'
                  isMulti
                  isClearable
                  className='react-select'
                  classNamePrefix='select'
                  theme={selectThemeColors}
                  options={userOptions}
                  value={filters.users}
                  onChange={options => setFilter('users', options || [])}
                  placeholder='All users'
                />
              </Col>
            )}
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='projects'>
                Projects
              </Label>
              <Select
                inputId='projects'
                isMulti
                isClearable
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={projectOptions}
                value={filters.projects}
                onChange={options => setFilter('projects', options || [])}
                placeholder='All projects'
              />
            </Col>
            <Col md={4} className='mb-1'>
              <Label className='form-label' for='activities'>
                Activities
              </Label>
              <Select
                inputId='activities'
                isMulti
                isClearable
                className='react-select'
                classNamePrefix='select'
                theme={selectThemeColors}
                options={activityOptions}
                value={filters.activities}
                onChange={options => setFilter('activities', options || [])}
                placeholder='All activities'
              />
            </Col>
          </Row>
        </CardBody>
      </Card>

      {hasRun && (
        <>
          <Row className='mt-1'>
            <StatCard icon={FileText} color='primary' label='Total Entries' value={rows.length} />
            <StatCard icon={Clock} color='info' label='Total Hours' value={totalHours.toFixed(2)} />
            <StatCard icon={Folder} color='warning' label='Distinct Projects' value={distinctProjects} />
            <StatCard icon={TrendingUp} color='success' label='Avg. Hours / Entry' value={avgHoursPerEntry.toFixed(2)} />
          </Row>

          <Card>
            <div className='react-dataTable'>
              <DataTable
                noHeader
                pagination
                responsive
                columns={columns}
                className='react-dataTable'
                data={rows}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                noDataComponent={<div className='p-2'>No timesheet entries match these filters.</div>}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

export default TimesheetReport
