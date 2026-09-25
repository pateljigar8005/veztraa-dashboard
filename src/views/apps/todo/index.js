import { Fragment, useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import classnames from 'classnames'
import Tasks from './Tasks'
import Sidebar from './Sidebar'
import TaskSidebar from './TaskSidebar'
import { useDispatch, useSelector } from 'react-redux'
import { getTasks, updateTask, selectTask, addTask, deleteTask, reOrderTasks } from './store'
import '@styles/react/apps/app-todo.scss'

const TODO = () => {
  const [sort, setSort] = useState('')
  const [query, setQuery] = useState('')
  const [mainSidebar, setMainSidebar] = useState(false)
  const [openTaskSidebar, setOpenTaskSidebar] = useState(false)
  // Assignee/due-date-range - the Advanced Search modal's own filters, on
  // top of the sidebar's Status/Priority/My-Tasks links and the plain
  // title search above.
  const [advancedFilters, setAdvancedFilters] = useState({})

  const dispatch = useDispatch()
  const store = useSelector(state => state.todo)

  const paramsURL = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const taskParam = Number(searchParams.get('task')) || null
  const params = {
    filter: paramsURL.filter || '',
    q: query || '',
    sortBy: sort || '',
    priority: paramsURL.priority || '',
    ...advancedFilters
  }

  const handleMainSidebar = () => setMainSidebar(!mainSidebar)
  const handleTaskSidebar = () => setOpenTaskSidebar(!openTaskSidebar)

  useEffect(() => {
    dispatch(getTasks(params))
  }, [store.tasks.length, paramsURL.filter, paramsURL.priority, query, sort, advancedFilters])

  // ?task=<id> (from a notification or the Dashboard's Upcoming card)
  // opens that todo's sidebar, then drops the param so closing the
  // sidebar/refreshing doesn't reopen it. Keyed on the param itself, not
  // mount - clicking a notification while already on /todo only changes
  // the query string, it doesn't remount this page.
  useEffect(() => {
    if (!taskParam) return
    dispatch(getTasks(params))
      .unwrap()
      .then(({ data }) => {
        const task = data.find(t => t.id === taskParam)
        if (task) {
          dispatch(selectTask(task))
          setOpenTaskSidebar(true)
        } else {
          toast.error('That todo no longer exists or you no longer have access to it')
        }
      })
      .catch(() => {})
      .finally(() => setSearchParams({}, { replace: true }))
  }, [taskParam])

  return (
    <Fragment>
      <Sidebar
        store={store}
        params={params}
        getTasks={getTasks}
        dispatch={dispatch}
        mainSidebar={mainSidebar}
        urlFilter={paramsURL.filter}
        setMainSidebar={setMainSidebar}
        handleTaskSidebar={handleTaskSidebar}
      />
      <div className='content-right'>
        <div className='content-wrapper'>
          <div className='content-body'>
            <div
              className={classnames('body-content-overlay', {
                show: mainSidebar === true
              })}
              onClick={handleMainSidebar}
            ></div>

            {store ? (
              <Tasks
                store={store}
                tasks={store.tasks}
                sort={sort}
                query={query}
                params={params}
                setSort={setSort}
                setQuery={setQuery}
                dispatch={dispatch}
                getTasks={getTasks}
                paramsURL={paramsURL}
                updateTask={updateTask}
                selectTask={selectTask}
                reOrderTasks={reOrderTasks}
                handleMainSidebar={handleMainSidebar}
                handleTaskSidebar={handleTaskSidebar}
                advancedFilters={advancedFilters}
                setAdvancedFilters={setAdvancedFilters}
              />
            ) : null}

            <TaskSidebar
              store={store}
              params={params}
              addTask={addTask}
              dispatch={dispatch}
              open={openTaskSidebar}
              updateTask={updateTask}
              selectTask={selectTask}
              deleteTask={deleteTask}
              handleTaskSidebar={handleTaskSidebar}
            />
          </div>
        </div>
      </div>
    </Fragment>
  )
}

export default TODO