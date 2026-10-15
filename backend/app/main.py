"""Entry point for the Multi-Doc Insight Engine backend API."""

import json
import logging

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from app.llm import analyse_document, answer_question, consolidate
from app.pdf_parser import PdfError, extract_text
from app.safety import find_injection
from app.validation import check_pdf

logger = logging.getLogger(__name__)

MAX_FILES = 10  # per upload, to protect the free-tier quota
MAX_QUESTION_LENGTH = 500  # characters
MAX_HISTORY_TURNS = 5  # earlier chat turns sent to the model with each question

# The API served by uvicorn. The frontend reaches it under /api.
app = FastAPI(
    title="Multi-Doc Insight Engine",
    description="Analyses uploaded PDFs and returns key details and a consolidated summary.",
    version="0.1.0",
)


def reject_if_too_many(files: list[UploadFile]) -> None:
    """Refuse uploads above MAX_FILES before any file is read."""
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Upload at most {MAX_FILES} at a time.",
        )


@app.get("/health")
def health() -> dict:
    """Liveness check: confirms the service is up."""
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(files: list[UploadFile] = File(...)) -> dict:
    """Accept one or more PDFs and return key details for each, plus a consolidated report."""
    reject_if_too_many(files)

    results = []
    for file in files:
        content = await file.read()
        error = check_pdf(file.filename or "", content)

        # Only files that passed the upload checks are read and sent to the model.
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
                # Log the real cause for the operator; keep the message friendly for the analyst.
                logger.exception("Analysis failed for %s", file.filename)
                error = "The AI service could not analyse this document. Please try again."

        # One bad file does not fail the batch: each file reports its own outcome.
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

    # Consolidate only the documents that were analysed successfully.
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
            logger.exception("Consolidation failed")
            consolidated = None  # per-document results are still returned

    return {"documents": results, "consolidated": consolidated}


@app.post("/api/ask")
async def ask(
    question: str = Form(""),
    history: str = Form("[]"),
    files: list[UploadFile] = File(...),
) -> dict:
    """Answer a question using only the uploaded PDFs."""
    reject_if_too_many(files)

    # Validate the question before reading any file.
    question = question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Please type a question.")
    if len(question) > MAX_QUESTION_LENGTH:
        raise HTTPException(status_code=400, detail="Question is too long (500 characters maximum).")

    # Earlier turns of the chat, sent by the browser as JSON. Keep only the latest few.
    try:
        turns = [
            {"question": str(t["question"])[:500], "answer": str(t["answer"])[:2000]}
            for t in json.loads(history)[-MAX_HISTORY_TURNS:]
        ]
    except (ValueError, TypeError, KeyError):
        turns = []  # ignore history we cannot read

    # Keep only the files that pass the same checks as /api/analyze.
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

    # Ask the model. Any failure becomes a 502 with a friendly message; the cause is logged.
    try:
        answer = answer_question(question, documents, turns)
        if answer is None:
            raise ValueError("Empty response from the model")
    except Exception:
        logger.exception("Question answering failed")
        raise HTTPException(status_code=502, detail="The AI service could not answer. Please try again.")

    return {"answer": answer}