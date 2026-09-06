import { useState } from 'react'
import Dashboard from './Dashboard'
import ReportStatus from './ReportStatus'
import RequestAccess from './RequestAccess'
import VictimReport, { type ReportedResult } from './VictimReport'


function App() {
  const [isDispatcher, setIsDispatcher] = useState(false)
  const [isApproved, setIsApproved] = useState(false)
  const [dispatcherName, setDispatcherName] = useState('')
  const [report, setReport] = useState<ReportedResult | null>(null)

  function handleApprove(name: string) {
    setDispatcherName(name)
    setIsApproved(true)
  }

  function handleSignOut() {
    setIsApproved(false)
    setDispatcherName('')
  }

  function handleReported(result: ReportedResult) {
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
