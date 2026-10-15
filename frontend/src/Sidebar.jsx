import { useRef, useState } from 'react'
import { openPdf } from './openPdf'

// Turns a size in bytes into something readable, like "2.6 MB".
function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// A short note describing how a file's analysis went.
function outcomeLabel(outcome) {
  if (outcome.status === 'error') {
    return { text: 'Not read', problem: true }
  }
  if (outcome.warning) {
    return { text: 'Flagged', problem: true }
  }
  return { text: `${outcome.pages} ${outcome.pages === 1 ? 'page' : 'pages'}`, problem: false }
}

// The left panel: add PDFs, review the list, and start the analysis.
function Sidebar({ files, onChange, onAnalyse, outcomes, loading }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Append newly chosen or dropped files to the list.
  function addFiles(newFiles) {
    // Skip a file that is already in the list (same name and size).
    const fresh = [...newFiles].filter(
      (candidate) => !files.some((f) => f.name === candidate.name && f.size === candidate.size),
    )
    if (fresh.length > 0) {
      onChange([...files, ...fresh])
    }
  }

  // Accept files dropped on the dropzone, unless an analysis is running.
  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    if (!loading) {
      addFiles(event.dataTransfer.files)
    }
  }

  // The button text reflects how many files are listed and whether work is in progress.
  let analyseLabel = 'Analyse documents'
  if (loading) {
    analyseLabel = 'Analysing…'
  } else if (files.length === 1) {
    analyseLabel = 'Analyse 1 document'
  } else if (files.length > 1) {
    analyseLabel = `Analyse ${files.length} documents`
  }

  return (
    <aside className="sidebar">
      <h1>Multi-Doc Insight Engine</h1>

      {/* Dropzone: drag PDFs here or use the hidden file input. */}
      <div
        className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <svg className="drop-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <p>Drop PDFs here</p>
        <button type="button" onClick={() => inputRef.current.click()} disabled={loading}>
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(event) => {
            addFiles(event.target.files)
            event.target.value = '' // lets the same file be chosen again after removing it
          }}
        />
        <p className="hint">Up to 20 MB each</p>
      </div>

      {/* The listed files, each with its size or its analysis outcome. */}
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => {
            const outcome = outcomes ? outcomeLabel(outcomes[index]) : null
            return (
              <li key={`${file.name}-${file.size}`}>
                {/* The filename opens the PDF in a new tab. */}
                <button
                  type="button"
                  className="file-name"
                  onClick={() => openPdf(file)}
                  title="Open this PDF in a new tab"
                >
                  {file.name}
                </button>
                <span className="file-meta">
                  <span className={outcome?.problem ? 'outcome-problem' : undefined}>
                    {outcome ? outcome.text : formatSize(file.size)}
                  </span>
                  <button
                    type="button"
                    className="link"
                    onClick={() => onChange(files.filter((_, i) => i !== index))}
                    disabled={loading}
                    aria-label={`Remove ${file.name}`}
                  >
                    Remove
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Starts the analysis. Disabled while the list is empty or work is in progress. */}
      <button className="primary analyse" onClick={onAnalyse} disabled={files.length === 0 || loading}>
        {analyseLabel}
      </button>
    </aside>
  )
}

export default Sidebar