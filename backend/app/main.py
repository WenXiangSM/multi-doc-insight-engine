"""Entry point for the Multi-Doc Insight Engine backend API."""

from fastapi import FastAPI, File, UploadFile
from app.validation import check_pdf
from app.pdf_parser import PdfError, extract_text
from app.llm import analyse_document, consolidate
from app.safety import find_injection

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
    """Accept one or more PDFs and return key details for each."""
    results = []
    for file in files:
        content = await file.read()
        error = check_pdf(file.filename or "", content)

        if not error:
            try:
                text, pages = extract_text(content)
                suspicious = find_injection(text)
                details = analyse_document(content)
                if details is None:
                    raise ValueError("Empty response from the model")
            except PdfError as exc:
                error = str(exc)
            except Exception:
                error = "The AI service could not analyse this document. Please try again."

        if error:
            results.append({"filename": file.filename, "status": "error", "error": error})
        else:
            results.append({
                "filename": file.filename,
                "status": "ok",
                "pages": pages,
                "details": details,
                  "warning": (
                    "This document contains text that looks like instructions to an AI. "
                    "Treat the results with caution."
                    if suspicious else None
                ),
            })
    good = [
        {"filename": r["filename"], **r["details"].model_dump()}
        for r in results
        if r["status"] == "ok"
    ]

    consolidated = None
    if good:
        try:
            consolidated = consolidate(good)
        except Exception:
            consolidated = None  

    return {"documents": results, "consolidated": consolidated}