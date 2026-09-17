import React, { Suspense } from 'react'

// ** Router Import
import Router from './router/Router'

// ** Utils
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
