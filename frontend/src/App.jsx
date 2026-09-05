import { useState } from 'react'
import Dashboard from './Dashboard.jsx'
import RequestAccess from './RequestAccess.jsx'

/**
 * Top-level screen switch. No real auth yet: RequestAccess flips `isApproved`
 * and hands up the dispatcher name, which the dashboard uses for claim tags.
 */
function App() {
  const [isApproved, setIsApproved] = useState(false)
  const [dispatcherName, setDispatcherName] = useState('')

  /** @param {string} name */
  function handleApprove(name) {
    setDispatcherName(name)
    setIsApproved(true)
  }

  function handleSignOut() {
    setIsApproved(false)
    setDispatcherName('')
  }

  if (!isApproved) {
    return <RequestAccess onApprove={handleApprove} />
  }

  return <Dashboard dispatcherName={dispatcherName} onSignOut={handleSignOut} />
}

export default App
