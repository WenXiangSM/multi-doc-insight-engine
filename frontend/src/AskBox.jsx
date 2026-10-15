import { useEffect, useRef, useState } from 'react'
import { openPdf } from './openPdf'


// A chat about the analysed PDFs. Answers come only from those documents.
function AskBox({ files }) {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState([]) // the conversation so far, kept in the browser only
  const [pending, setPending] = useState('') // the question currently being answered
  const [error, setError] = useState('')
  const endRef = useRef(null)

  // Keep the newest message in view.
  useEffect(() => {
    if (turns.length > 0 || pending) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [turns, pending])

  // Send the question, the earlier turns and the PDFs, then add the answer to the thread.
  async function handleAsk(event) {
    event.preventDefault() // stop the browser reloading the page on submit
    const asked = question.trim()
    setPending(asked)
    setQuestion('')
    setError('')
    try {
      const formData = new FormData()
      formData.append('question', asked)
      // Send earlier turns so follow-up questions make sense. The server stores nothing.
      formData.append(
        'history',
        JSON.stringify(turns.map((turn) => ({ question: turn.question, answer: turn.answer }))),
      )
      for (const file of files) {
        formData.append('files', file)
      }
      const response = await fetch('/api/ask', { method: 'POST', body: formData })
      const body = await response.json()
      if (response.ok) {
        setTurns([
          ...turns,
          {
            question: asked,
            answer: body.answer.answer,
            sources: body.answer.sources,
            pages: body.answer.pages,
            found: body.answer.found_in_documents,
          },
        ])
      } else {
        setError(typeof body.detail === 'string' ? body.detail : 'The question could not be answered.')
        setQuestion(asked) // put the question back so it can be sent again
      }
    } catch {
      setError('The server could not be reached. Check that it is running, then ask again.')
      setQuestion(asked)
    } finally {
      setPending('')
    }
  }

  // One pill per source, each opening the PDF at the page used.
  function sourcePills(turn) {
    if (!turn.found || turn.sources.length === 0) {
      return <span>Not found in the uploaded documents</span>
    }
    return turn.sources.map((name, j) => {
      const file = files.find((f) => f.name === name)
      const page = turn.pages?.[j]
      const label = page ? `${name}, page ${page}` : name
      if (!file) {
        return <span key={j}>{label}</span>
      }
      return (
        <button
          key={j}
          type="button"
          className="page-link"
          onClick={() => openPdf(file, page)}
          title={`Open ${name}${page ? ` at page ${page}` : ''}`}
        >
          {label}
        </button>
      )
    })
  }

  return (
    <>
      {/* The conversation so far, with the pending question at the end. */}
      <section className="thread" aria-live="polite">
        {turns.map((turn, i) => (
          <div key={i} className="turn">
            <p className="bubble">{turn.question}</p>
            <div className="reply">
              <p>{turn.answer}</p>
              <p className="sources">{turn.found && turn.sources.length > 0 ? 'From ' : ''}{sourcePills(turn)}</p>
            </div>
          </div>
        ))}
        {/* The question being answered, shown until the reply arrives. */}
        {pending && (
          <div className="turn">
            <p className="bubble">{pending}</p>
            <p className="reply reply-pending">Reading the documents…</p>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <div ref={endRef} className="thread-end" />
      </section>

      {/* The question box, pinned to the bottom of the panel. */}
      <form className="composer" onSubmit={handleAsk}>
        <label htmlFor="question" className="visually-hidden">
          Ask about these documents
        </label>
        <input
          id="question"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about these documents"
          maxLength={500}
          disabled={pending !== ''}
          autoComplete="off"
        />
        <button type="submit" className="primary" disabled={pending !== '' || question.trim() === ''}>
          Ask
        </button>
        <p className="composer-note">Answers come only from the PDFs you analysed.</p>
      </form>
    </>
  )
}

export default AskBox