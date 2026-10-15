"""Entry point for the Multi-Doc Insight Engine backend API."""

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from app.validation import check_pdf
from app.pdf_parser import PdfError, extract_text
from app.llm import analyse_document, answer_question, consolidate
from app.safety import find_injection
import json

MAX_FILES = 10 

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
    if len(files)> MAX_FILES: 
        raise HTTPException(
            status_code= 400, 
            detail = f"Too many files. Upload at most {MAX_FILES} at a time.",
        )
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



MAX_QUESTION_LENGTH = 500
MAX_HISTORY_TURNS = 5


@app.post("/api/ask")
async def ask(
    question: str = Form(""),
    history: str = Form("[]"),
    files: list[UploadFile] = File(...),
) -> dict:
    """Answer a question using only the uploaded PDFs."""
    if len(files)> MAX_FILES: 
        raise HTTPException(
            status_code= 400, 
            detail = f"Too many files. Upload at most {MAX_FILES} at a time.",
        )
    question = question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Please type a question.")
    if len(question) > MAX_QUESTION_LENGTH:
        raise HTTPException(status_code=400, detail="Question is too long (500 characters maximum).")

    try:
        turns = [
            {"question": str(t["question"])[:500], "answer": str(t["answer"])[:2000]}
            for t in json.loads(history)[-MAX_HISTORY_TURNS:]
        ]
    except (ValueError, TypeError, KeyError):
        turns = []  

    documents = []
    for file in files:
        content = await file.read()
        if check_pdf(file.filename or "", content):
            continue
        try:
            extract_text(content)
        except PdfError:
            continue
        documents.append((file.filename, content))

    if not documents:
        raise HTTPException(status_code=400, detail="No readable PDF to answer from.")

    try:
        answer = answer_question(question, documents, turns)
        if answer is None:
            raise ValueError("Empty response from the model")
    except Exception:
        raise HTTPException(status_code=502, detail="The AI service could not answer. Please try again.")

    return {"answer": answer}