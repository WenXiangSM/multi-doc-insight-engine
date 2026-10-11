"""Reads content out of a PDF using the PyMuPDF library."""

import pymupdf

class PdfError(Exception):
    """Raised this when a PDF cannot be read. """

def extract_text(content: bytes) -> tuple[str, int]:
    """Return the PDF's full text and its number of pages."""
    try: 
        doc = pymupdf.open(stream = content, filetype="pdf")
    except Exception: 
        raise PdfError("File is corrupted or not a readable PDF.")
    with doc: 
        if doc.needs_pass: 
                raise PdfError("PDF is password-protected")
        text = "\n".join(page.get_text() for page in doc)
        return text, doc.page_count