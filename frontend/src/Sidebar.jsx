import { useRef, useState } from 'react'

// Turns a size in bytes into something readable, like "2.6 MB".
function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function outcomeLabel(outcome) {
  if (outcome.status === 'error') {
    return { text: 'Not read', problem: true }
  }
  if (outcome.warning) {
    return { text: 'Flagged', problem: true }
  }
  return { text: `${outcome.pages} ${outcome.pages === 1 ? 'page' : 'pages'}`, problem: false }
}

function Sidebar({ files, onChange, onAnalyse, onSelect, outcomes, loading }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function addFiles(newFiles) {
    // Skip a file that is already in the list (same name and size).
    const fresh = [...newFiles].filter(
      (candidate) => !files.some((f) => f.name === candidate.name && f.size === candidate.size),
    )
    if (fresh.length > 0) {
      onChange([...files, ...fresh])
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    if (!loading) {
      addFiles(event.dataTransfer.files)
    }
  }

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

      <div
        className={dragging ? 'dropzone dropzone-active' : 'dropzone'}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
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

      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => {
            const outcome = outcomes ? outcomeLabel(outcomes[index]) : null
            return (
              <li key={`${file.name}-${file.size}`}>
                {outcome ? (
                  <button type="button" className="file-name file-link" onClick={() => onSelect(index)}>
                    {file.name}
                  </button>
                ) : (
                  <span className="file-name">{file.name}</span>
                )}
                <span className="file-meta">
                  {outcome ? (
                    <span className={outcome.problem ? 'outcome-problem' : undefined}>{outcome.text}</span>
                  ) : (
                    formatSize(file.size)
                  )}
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

      <button className="primary analyse" onClick={onAnalyse} disabled={files.length === 0 || loading}>
        {analyseLabel}
      </button>
    </aside>
  )
}

export default Sidebar