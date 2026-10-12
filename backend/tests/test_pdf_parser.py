import pymupdf
import pytest 


from app.pdf_parser import PdfError, extract_text

def make_pdf(text:str, password: str | None = None) -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72,72), text)
    if password: 
        return doc.tobytes(encryption=pymupdf.PDF_ENCRYPT_AES_256, user_pw=password)
    return doc.tobytes()

def test_reads_text_page_count():
    text,pages = extract_text(make_pdf("Hello report"))
    assert "Hello report" in text
    assert pages == 1

def test_rejects_corrupted_pdf():
    with pytest.raises(PdfError):
        extract_text(b"%PDF-1.7 this is broken")

def test_rejects_password_protected_pdf():
    with pytest.raises(PdfError):
        extract_text(make_pdf("Secret", password="hunter2"))
