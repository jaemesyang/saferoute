import { useState } from 'react'
import Dashboard from './Dashboard'
import ReportStatus from './ReportStatus'
import RequestAccess from './RequestAccess'
import ResolveHotspot from './ResolveHotspot'
import VictimReport, { type ReportedResult } from './VictimReport'

/**
 * Pull the QR resolve target out of the query string.
 *
 * Query params rather than a path like /resolve/123 on purpose: this app is
 * served as static files, and a deep path only works if the host is configured
 * to rewrite unknown paths back to index.html. A scanned QR that 404s is a
 * driver stranded at the curb, so the link is built out of something that
 * always lands on the one file we know is there.
 */
function readResolveTarget(): { id: string, token: string } | null {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('resolve')
  const token = params.get('token')
  if (!id || !token) return null
  return { id, token }
}


function App() {
  // Read once, at mount: the resolve link is where this tab started, and
  // nothing in the app rewrites the URL out from under it.
  const [resolveTarget] = useState(readResolveTarget)
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

  // Ahead of every other screen — someone arriving on a resolve link is not
  // here to file a report or sign in as a dispatcher.
  if (resolveTarget) {
    return <ResolveHotspot id={resolveTarget.id} token={resolveTarget.token} />
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
