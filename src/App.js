import React, { Suspense } from 'react'
import Router from './router/Router'
import RouteRequestCanceller from './utility/RouteRequestCanceller'

const App = () => {
  return (
    <Suspense fallback={null}>
      <RouteRequestCanceller />
      <Router />
    </Suspense>
  )
}

export default App