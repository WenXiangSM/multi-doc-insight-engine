import { useState } from 'react'
import Results from './Results'

function App() {
  const [files, setFiles] = useState([])         
  const [result, setResult] = useState(null)    
  const [loading, setLoading] = useState(false)  
  const [error, setError] = useState('')         

  async function handleUpload() {
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
    } catch {
      setError('Could not analyse the documents. Check the server is running and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Multi-Doc Insight Engine</h1>
      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => setFiles([...e.target.files])}
      />
      <button onClick={handleUpload} disabled={files.length === 0 || loading}>
        {loading ? 'Analysing…' : 'Analyse'}
      </button>

      {loading && <p>Analysing {files.length} document(s). This can take up to a minute.</p>}
      {error && <p role="alert">{error}</p>}
      {result && <Results result={result} />}    </div>
  )
}

export default App