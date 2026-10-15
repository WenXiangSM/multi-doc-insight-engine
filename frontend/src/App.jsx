import { useState } from 'react'
import Sidebar from './Sidebar'
import Results from './Results'
import AskBox from './AskBox'


// Top-level component: owns the file list, the analysis result and the three-column layout.
function App() {
  const [files, setFiles] = useState([]) // PDFs listed in the sidebar
  const [analysed, setAnalysed] = useState({ id: 0, files: [] }) // PDFs behind the current results
  const [result, setResult] = useState(null) // the backend's answer
  const [loading, setLoading] = useState(false) // true while waiting
  const [error, setError] = useState('') // message if the whole request fails

  // Send every listed PDF to the backend and keep its answer.
  async function handleAnalyse() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      for (const file of files) {
        formData.append('files', file)
      }
      const response = await fetch('/api/analyze', { method: 'POST', body: formData })
      const body = await response.json()
      if (!response.ok) {
        // Show the backend's own message when it sent one, such as the 10-file limit.
        throw new Error(typeof body.detail === 'string' ? body.detail : 'Server error')
      }
      setResult(body)
      // Remember which files these results belong to, so the chat asks about the same ones.
      setAnalysed((previous) => ({ id: previous.id + 1, files }))
    } catch (err) {
      setError(
        err.message === 'Server error' || err.message === 'Failed to fetch'
          ? 'The documents could not be analysed. Check that the server is running, then try again.'
          : err.message,
      )
    } finally {
      setLoading(false)
    }
  }

  // Only show result marks in the sidebar while the list still matches what was analysed.
  const outcomes = result && files === analysed.files ? result.documents : null
  const hasReadableDocument = result?.documents.some((doc) => doc.status === 'ok')

  return (
    <div className="layout">
      {/* Left panel: upload, file list and the Analyse button. */}
      <Sidebar
        files={files}
        onChange={setFiles}
        onAnalyse={handleAnalyse}
        outcomes={outcomes}
        loading={loading}
      />

      {/* Centre column: welcome text, progress, an error or the results. */}
      <main className="main">
        <div className="column">
          {/* Welcome text until the first analysis starts. */}
          {!result && !loading && !error && (
            <div className="welcome">
              <h2>What do these documents say?</h2>
              <p>
                Add the PDFs you were sent, then analyse them. You get one summary across all of
                them, the key details of each, and a chat to ask follow-up questions.
              </p>
            </div>
          )}

          {/* Progress note while the backend reads the files. */}
          {loading && (
            <p className="status" role="status">
              <span className="spinner" aria-hidden="true" />
              Reading {files.length === 1 ? 'the document' : `${files.length} documents`}. This
              usually takes under a minute.
            </p>
          )}

          {/* A failure of the whole request, otherwise the results. */}
          {error && <p role="alert">{error}</p>}
          {result && <Results result={result} files={analysed.files} />}
        </div>
      </main>

      {/* The chat sits in its own panel. A new analysis (new id) starts a fresh chat. */}
      {hasReadableDocument && (
        <aside className="chat-panel">
          <h2 className="chat-title">
            <svg className="chat-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 5h16v11H9l-5 4V5z" />
            </svg>
            Ask the documents
          </h2>
          <AskBox key={analysed.id} files={analysed.files} />
        </aside>
      )}
    </div>
  )
}

export default App