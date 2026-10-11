"""Entry point for the Multi-Doc Insight Engine backend API."""

from fastapi import FastAPI, File, UploadFile
from app.validation import check_pdf
from app.pdf_parser import PdfError, extract_text

# this creates the web service
app = FastAPI(
    title="Multi-Doc Insight Engine",
    description="Analyses uploaded PDFs and returns key details and a consolidated summary.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    """Liveness check: confirms the service is up. Used by Docker and CI later."""
    return {"status": "ok"}

@app.post("/api/analyze")
async def analyze(files: list[UploadFile] = File(...)) -> dict:
    """Accept one or more files and validate each one."""
    results = []
    for file in files:
        content = await file.read()
        error = check_pdf(file.filename or "", content)
        if not error: 
            try: 
                text, pages = extract_text(content)
            except PdfError as exc: 
                error = str(exc)
        if error:
            results.append({"filename": file.filename, "status": "error", "error": error})
        else:
            results.append({
                "filename": file.filename,
                "status": "ok", 
                "pages": pages, 
                "preview": text[:300],
            })
    return {"documents": results}