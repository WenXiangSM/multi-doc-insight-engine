"""Reads content out of a PDF using the PyMuPDF library."""

import pymupdf

class PdfError(Exception):
    """Raised when a PDF cannot be read."""

def extract_text(content: bytes) -> tuple[str, int]:
    """Return the PDF's full text and its number of pages."""
    # Open from memory. PyMuPDF raises on anything that is not a PDF.
    try: 
        doc = pymupdf.open(stream = content, filetype="pdf")
    except Exception: 
        raise PdfError("File is corrupted or not a readable PDF.")
    # Close the document when done, even if reading a page fails.
    with doc: 
        if doc.needs_pass: 
                raise PdfError("PDF is password-protected")
        text = "\n".join(page.get_text() for page in doc)
        return text, doc.page_count