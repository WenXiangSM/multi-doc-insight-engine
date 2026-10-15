// Opens an uploaded PDF in a new tab, optionally at a page. Nothing is sent to the server.
export function openPdf(file, page) {
  const url = URL.createObjectURL(file)
  window.open(page ? `${url}#page=${page}` : url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

