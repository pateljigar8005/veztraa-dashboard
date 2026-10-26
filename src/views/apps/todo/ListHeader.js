import { Row, Col, Input } from 'reactstrap'

// Same "Show N Entries ... Search" header every module list uses.
const ListHeader = ({ id, rowsPerPage, onPerPage, searchTerm, onSearch, perPageOptions = [10, 25, 50] }) => (
  <div className='invoice-list-table-header w-100 me-1 ms-50 mt-1 mb-75'>
    <Row>
      <Col xl='6' className='d-flex align-items-center p-0'>
        <div className='d-flex align-items-center w-100'>
          <label htmlFor={`${id}-per-page`}>Show</label>
          <Input
            className='mx-50'
            type='select'
            id={`${id}-per-page`}
            value={rowsPerPage}
            onChange={e => onPerPage(Number(e.target.value))}
            style={{ width: '5rem' }}
          >
            {perPageOptions.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Input>
          <label htmlFor={`${id}-per-page`}>Entries</label>
        </div>
      </Col>
      <Col
        xl='6'
        className='d-flex align-items-sm-center justify-content-xl-end justify-content-start flex-xl-nowrap flex-wrap flex-sm-row flex-column p-0 mt-xl-0 mt-1'
      >
        <div className='d-flex align-items-center mb-sm-0 mb-1'>
          <Input id={`${id}-search`} className='w-100' type='text' placeholder='Search' value={searchTerm} onChange={e => onSearch(e.target.value)} />
        </div>
      </Col>
    </Row>
  </div>
)

export default ListHeader
