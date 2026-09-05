import { useState } from 'react'
import './RequestAccess.css'

/**
 * @param {Object} props
 * @param {(name: string) => void} props.onApprove
 */
function RequestAccess({ onApprove }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  /** @param {React.FormEvent<HTMLFormElement>} event */
  function handleSubmit(event) {
    event.preventDefault()

    const trimmedName = name.trim()
    if (!trimmedName || !code.trim()) {
      setError('Dispatcher name and access code are both required.')
      return
    }

    setError('')
    onApprove(trimmedName)
  }

  return (
    <main className="access">
      <form className="access-card" onSubmit={handleSubmit} noValidate>
        <header className="access-head">
          <div className="access-mark">
            <span className="access-mark-name">SAFEROUTE</span>
            <span className="access-mark-sub">Dispatch Console</span>
          </div>
          <span className="pill is-dim">
            <span className="dot" />
            Restricted
          </span>
        </header>

        <div className="access-body">
          <p className="access-intro">
            Sign in to view active pickup hotspots and claim runs.
          </p>

          <div className="field">
            <label className="label" htmlFor="dispatcher-name">
              Dispatcher name
            </label>
            <input
              id="dispatcher-name"
              name="dispatcherName"
              type="text"
              autoComplete="name"
              autoFocus
              placeholder="e.g. J. Rivera"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="access-code">
              Access code
            </label>
            <input
              id="access-code"
              name="accessCode"
              type="password"
              autoComplete="off"
              placeholder="••••••"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>

          {error && (
            <p className="access-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary access-submit" type="submit">
            Request access
          </button>
        </div>

        <footer className="access-foot label">
          Demo build — credentials are not verified
        </footer>
      </form>
    </main>
  )
}

export default RequestAccess
