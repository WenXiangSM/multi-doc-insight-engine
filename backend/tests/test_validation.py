from app.validation import check_pdf

def test_rejects_non_pdf_extension():
    assert check_pdf("notes.txt", b"hello") == "This is not a valid PDF file"


def test_rejects_empty_file():
    assert check_pdf("empty.pdf", b"") == "This file is currently empty"


def test_rejects_oversized_file():
    too_big = b"%PDF-" + b"0" * (21 * 1024 * 1024)  
    assert check_pdf("big.pdf", too_big) == "The file size should not be larger than 20 MB."

def test_rejects_fake_pdf():
    assert check_pdf("fake.pdf", b"this is just text") == "File content is not a valid PDF."


def test_accepts_real_pdf():
    assert check_pdf("report.pdf", b"%PDF-1.7 some content") is None 

