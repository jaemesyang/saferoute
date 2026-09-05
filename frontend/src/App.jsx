import { useState } from 'react'
import Dashboard from './Dashboard.jsx'
import ReportStatus from './ReportStatus.jsx'
import RequestAccess from './RequestAccess.jsx'
import VictimReport from './VictimReport.jsx'


function App() {
  const [isDispatcher, setIsDispatcher] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [dispatcherName, setDispatcherName] = useState('')
  const [report, setReport] = useState(null)

  /** @param {string} name */
  function handleApprove(name) {
    setDispatcherName(name)
    setIsApproved(true)
  }

  function handleSignOut() {
    setIsApproved(false)
    setDispatcherName('')
  }

  /**
   * @param {{ assignment: import('./api/reports.js').Assignment, coords: { lat: number, lng: number }, isStub: boolean }} result
   */
  function handleReported(result) {
    setReport(result)
  }

  if (!isDispatcher) {
    if (report) {
      return (
        <ReportStatus
          assignment={report.assignment}
          coords={report.coords}
          isStub={report.isStub}
        />
      )
    }

    return (
      <VictimReport
        onReported={handleReported}
        onDispatcherAccess={() => setIsDispatcher(true)}
      />
    )
  }

  if (!isApproved) {
    return <RequestAccess onApprove={handleApprove} />
  }

  return <Dashboard dispatcherName={dispatcherName} onSignOut={handleSignOut} />
}

export default App
