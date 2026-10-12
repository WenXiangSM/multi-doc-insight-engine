
function clean(items) {
  return items.filter((item) => item.trim() !== '')
}

function BulletList({ title, items, highlight = false }) {
  const visible = clean(items)
  if (visible.length === 0) {
    return null
  }
  return (
    <>
      <h4>{title}</h4>
      <ul className={highlight ? 'takeaways' : undefined}>
        {visible.map((item, i) => (
          <li key={i}>{highlight ? <span>{item}</span> : item}</li>
        ))}
      </ul>
    </>
  )
}

function TagList({ title, items }) {
  const visible = clean(items)
  if (visible.length === 0) {
    return null
  }
  return (
    <>
      <h4>{title}</h4>
      <ul className="tags">
        {visible.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  )
}

function DocumentSection({ doc, index, open }) {
  if (doc.status === 'error') {
    return (
      <div className="document document-failed" id={`doc-${index}`}>
        <p className="document-name">{doc.filename}</p>
        <p role="alert">This file was not analysed. {doc.error}</p>
      </div>
    )
  }

  return (
    <details className="document" id={`doc-${index}`} open={open}>
      <summary>
        <span className="document-name">{doc.details.title}</span>
        <span className="document-meta">
          {doc.filename}, {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
        </span>
      </summary>
      {doc.warning && <p role="alert">{doc.warning}</p>}
      <p>{doc.details.summary}</p>
      <TagList title="Main topics" items={doc.details.main_topics} />
      <TagList title="Key entities" items={doc.details.key_entities} />
      <BulletList title="Notable points" items={doc.details.notable_points} />
    </details>
  )
}

function Results({ result }) {
  const { documents, consolidated } = result
  const readable = documents.filter((doc) => doc.status === 'ok').length

  return (
    <>
      {consolidated && (
        <section className="report">
          <h2>Summary across {readable === 1 ? '1 document' : `${readable} documents`}</h2>
          <p className="lead">{consolidated.overview}</p>
          <BulletList title="Key takeaways" items={consolidated.key_takeaways} highlight />
          <BulletList title="Common themes" items={consolidated.common_themes} />
          <BulletList title="Key differences" items={consolidated.key_differences} />
        </section>
      )}

      {!consolidated && readable > 0 && (
        <p role="alert">
          The summary could not be written this time. The details of each document are below.
          Analyse again to retry.
        </p>
      )}

      <section className="documents">
        <h3>Each document</h3>
        {documents.map((doc, i) => (
          <DocumentSection key={i} doc={doc} index={i} open={documents.length === 1} />
        ))}
      </section>
    </>
  )
}

export default Results