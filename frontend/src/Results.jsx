
function BulletList({ title, items }) {
  return (
    <>
      <h4>{title}</h4>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  )
}

function Results({ result }) {
  const { documents, consolidated } = result

  return (
    <div>
      {consolidated && (
        <section className="card">
          <h2>Consolidated report</h2>
          <p>{consolidated.overview}</p>
          <BulletList title="Common themes" items={consolidated.common_themes} />
          <BulletList title="Key differences" items={consolidated.key_differences} />
          <BulletList title="Key takeaways" items={consolidated.key_takeaways} />
        </section>
      )}

      <h2>Documents</h2>
      {documents.map((doc, i) => (
        <section className="card" key={i}>
          <h3>{doc.filename}</h3>
          {doc.status === 'error' ? (
            <p role="alert">Could not analyse this file: {doc.error}</p>
          ) : (
            <>
              {doc.warning && <p role="alert">{doc.warning}</p>}
              <p>
                <strong>{doc.details.title}</strong> ({doc.pages} pages)
              </p>
              <p>{doc.details.summary}</p>
              <BulletList title="Main topics" items={doc.details.main_topics} />
              <BulletList title="Key entities" items={doc.details.key_entities} />
              <BulletList title="Notable points" items={doc.details.notable_points} />
            </>
          )}
        </section>
      ))}
    </div>
  )
}

export default Results