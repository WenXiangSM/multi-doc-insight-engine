import { useEffect, useRef, useState } from 'react'

function AskBox({ files }) {
  const [question, setQuestion] = useState('')
  const [turns, setTurns] = useState([]) 
  const [pending, setPending] = useState('') // the question currently being answered
  const [error, setError] = useState('')
  const endRef = useRef(null)

  // Keep the newest message in view.
  useEffect(() => {
    if (turns.length > 0 || pending) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [turns, pending])

  async function handleAsk(event) {
    event.preventDefault() 
    const asked = question.trim()
    setPending(asked)
    setQuestion('')
    setError('')
    try {
      const formData = new FormData()
      formData.append('question', asked)
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
            found: body.answer.found_in_documents,
          },
        ])
      } else {
        setError(typeof body.detail === 'string' ? body.detail : 'The question could not be answered.')
        setQuestion(asked) 
      }
    } catch {
      setError('The server could not be reached. Check that it is running, then ask again.')
      setQuestion(asked)
    } finally {
      setPending('')
    }
  }

  return (
    <>
      <section className="thread" aria-live="polite">
        {turns.map((turn, i) => (
          <div key={i} className="turn">
            <p className="bubble">{turn.question}</p>
            <div className="reply">
              <p>{turn.answer}</p>
              <p className="sources">
                {turn.found && turn.sources.length > 0
                  ? `From ${turn.sources.join(', ')}`
                  : 'Not found in the uploaded documents'}
              </p>
            </div>
          </div>
        ))}
        {pending && (
          <div className="turn">
            <p className="bubble">{pending}</p>
            <p className="reply reply-pending">Reading the documents…</p>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <div ref={endRef} className="thread-end" />
      </section>

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