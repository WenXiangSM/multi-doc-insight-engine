import { useState } from 'react'
import Sidebar from './Sidebar'
import Results from './Results'
import AskBox from './AskBox'

function App() {
  const [files, setFiles] = useState([]) // PDFs listed in the sidebar
  const [analysed, setAnalysed] = useState({ id: 0, files: [] }) // PDFs behind the current results
  const [result, setResult] = useState(null) // the backend's answer
  const [loading, setLoading] = useState(false) // true while waiting
  const [error, setError] = useState('') // message if the whole request fails

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
      if (!response.ok) {
        throw new Error('Server error')
      }
      setResult(await response.json())
      // Remember which files these results belong to, so the chat asks about the same ones.
      setAnalysed((previous) => ({ id: previous.id + 1, files }))
    } catch {
      setError('The documents could not be analysed. Check that the server is running, then try again.')
    } finally {
      setLoading(false)
    }
  }

  function showDocument(index) {
    const section = document.getElementById(`doc-${index}`)
    if (section) {
      section.open = true
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const outcomes = result && files === analysed.files ? result.documents : null
  const hasReadableDocument = result?.documents.some((doc) => doc.status === 'ok')

  return (
    <div className="layout">
      <Sidebar
        files={files}
        onChange={setFiles}
        onAnalyse={handleAnalyse}
        onSelect={showDocument}
        outcomes={outcomes}
        loading={loading}
      />

      <main className="main">
        <div className="column">
          {!result && !loading && !error && (
            <div className="welcome">
              <h2>What do these documents say?</h2>
              <p>
                Add the PDFs you were sent, then analyse them. You get one summary across all of
                them, the key details of each, and a chat to ask follow-up questions.
              </p>
            </div>
          )}

          {loading && (
            <p className="status" role="status">
              <span className="spinner" aria-hidden="true" />
              Reading {files.length === 1 ? 'the document' : `${files.length} documents`}. This
              usually takes under a minute.
            </p>
          )}

          {error && <p role="alert">{error}</p>}
          {result && <Results result={result} />}
          {hasReadableDocument && <AskBox key={analysed.id} files={analysed.files} />}
        </div>
      </main>
    </div>
  )
}

export default App