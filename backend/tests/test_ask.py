import pymupdf
import pytest 
from fastapi.testclient import TestClient

from app import main 
from app.schemas import Answer 

client = TestClient(main.app)

def make_pdf(text: str) -> bytes:
    """Build a small one-page PDF in memory."""
    doc = pymupdf.open()
    doc.new_page().insert_text((72, 72), text)
    return doc.tobytes()


@pytest.fixture(autouse=True)
def fake_gemini(monkeypatch):
    """Before every test, swap the real Gemini call for a fake with a fixed answer."""

    def fake_answer(question, documents, history):
        return Answer(answer="Fake answer", sources=["report.pdf"], pages=[1], found_in_documents=True)
    monkeypatch.setattr(main, "answer_question", fake_answer)


def test_question_with_pdf_returns_answer():
    files = [("files", ("report.pdf", make_pdf("A normal report"), "application/pdf"))]
    response = client.post("/api/ask", data={"question": "What is this about?"}, files=files)

    assert response.status_code == 200
    assert response.json()["answer"]["answer"] == "Fake answer"


def test_blank_question_is_rejected():
    files = [("files", ("report.pdf", make_pdf("A normal report"), "application/pdf"))]
    response = client.post("/api/ask", data={"question": "   "}, files=files)

    assert response.status_code == 400
    assert response.json()["detail"] == "Please type a question."


def test_question_without_readable_pdf_is_rejected():
    files = [("files", ("notes.txt", b"hello", "text/plain"))]
    response = client.post("/api/ask", data={"question": "What is this about?"}, files=files)

    assert response.status_code == 400

def test_unreadable_history_is_ignored():
    files = [("files", ("report.pdf", make_pdf("A normal report"), "application/pdf"))]
    data = {"question": "What is this about?", "history": "this is not JSON"}
    response = client.post("/api/ask", data=data, files=files)

    assert response.status_code == 200