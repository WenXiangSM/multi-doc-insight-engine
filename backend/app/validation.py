MAX_FILE_SIZE = 20 * 1024 * 1024

def check_pdf(filename: str, content: bytes) -> str | None: 
    if not filename.lower().endswith(".pdf"): 
        return "This is not a valid PDF file"
    if len(content) == 0: 
        return "This file is currently empty"
    if len(content) > MAX_FILE_SIZE: 
        return "The file size should not be larger than 20 MB."
    if not content.startswith(b"%PDF-"):
        return "File content is not a valid PDF."
    return None
