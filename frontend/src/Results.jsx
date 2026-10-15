// Shows the consolidated summary first, then one expandable section per document.
// Every point links to the page of the PDF it came from.

import { openPdf } from './openPdf'

// Removes blank entries so a list never shows an empty item.
function clean(items) {
  return items.filter((item) => item.trim() !== '')
}

// Wraps numbers, percentages and money in <strong> so they stand out.
function emphasiseFigures(text) {
  const parts = text.split(/(\$?\d[\d,.]*%?(?:\s?(?:million|billion))?)/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
}

// A pill after a point: "page 5", or "Scam Brief.pdf, page 5" when the file needs naming.
function PageLink({ file, page, showName = false }) {
  if (!file || !page) {
    return null
  }
  const label = showName ? `${file.name}, page ${page}` : `page ${page}`  
  return (
    <button
      type="button"
      className="page-link"
      onClick={() => openPdf(file, page)}
      title={`Open page ${page} of ${file.name}`}
    >
      {label}
    </button>
  )
}

// A titled bullet list of plain strings. Renders nothing when every item is blank.
function BulletList({ title, items }) {
  const visible = clean(items)
  if (visible.length === 0) {
    return null
  }
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {visible.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  )
}
// A titled list of points, each followed by a page pill. Takeaways get bold figures and the file name.
function PointList({ title, points, fileFor, highlight = false, showName = false }) {
  const visible = points.filter((point) => point.text.trim() !== '')
  if (visible.length === 0) {
    return null
  }
  return (
    <>
      <h4>{title}</h4>
      <ul className={highlight ? 'takeaways' : undefined}>
        {visible.map((point, i) => (
          <li key={i}>
            {highlight ? emphasiseFigures(point.text) : point.text}{' '}
            <PageLink file={fileFor(point)} page={point.page} showName={showName} />
          </li>
        ))}
      </ul>
    </>
  )
}
// A titled comma-separated list, used for topics and entities.
function TagList({ title, items }) {
  const visible = clean(items)
  if (visible.length === 0) {
    return null
  }
  return (
    <>
      <h4>{title}</h4>
      <p className="inline-list">{visible.join(', ')}</p>
    </>
  )
}

// One document: a failure notice, or an expandable section with its key details.
function DocumentSection({ doc, file, index, open }) {
  // A file that failed validation or analysis shows only its name and the reason.
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
      <PointList title="Notable points" points={doc.details.notable_points} fileFor={() => file} />
    </details>
  )
}

// The whole results view: the consolidated summary, then one section per document.
function Results({ result, files }) {
  const { documents, consolidated } = result
  const readable = documents.filter((doc) => doc.status === 'ok').length

  // Finds the uploaded File object for a filename, so a point can open it.
  const fileNamed = (name) => files.find((file) => file.name === name)

  return (
    <>
      {/* The summary across documents, when the consolidation succeeded. */}
      {consolidated && (
        <section className="report">
          <h2>Summary across {readable === 1 ? '1 document' : `${readable} documents`}</h2>
          <p className="lead">{consolidated.overview}</p>
          {/* With one document the takeaways would repeat its notable points, so skip them. */}
          {readable > 1 && (
            <PointList
              title="Key takeaways"
              points={consolidated.key_takeaways}
              fileFor={(point) => fileNamed(point.filename)}
              highlight
              showName
            />
          )}
          <BulletList title="Common themes" items={consolidated.common_themes} />
          <BulletList title="Key differences" items={consolidated.key_differences} />
        </section>
      )}

      {/* The per-document calls worked but the consolidation did not. */}
      {!consolidated && readable > 0 && (
        <p role="alert">
          The summary could not be written this time. The details of each document are below.
          Analyse again to retry.
        </p>
      )}

      {/* Every uploaded document, including the ones that failed. */}
      <section className="documents">
        <h3>Each document</h3>
        {documents.map((doc, i) => (
          <DocumentSection
            key={i}
            doc={doc}
            file={fileNamed(doc.filename)}
            index={i}
            open={documents.length === 1}
          />
        ))}
      </section>
    </>
  )
}

export default Results