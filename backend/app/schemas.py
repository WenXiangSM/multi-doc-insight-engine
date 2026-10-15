"""Defines the shape of the results we return. Gemini fills in exactly these fields."""

from pydantic import BaseModel


class Point(BaseModel):
    """One statement, with the page it was found on (first page is 1)."""

    text: str
    page: int


class SourcedPoint(BaseModel):
    """One statement, with the document and page it was found in."""

    text: str
    filename: str
    page: int


class KeyDetails(BaseModel):
    """Key details extracted from one document."""

    title: str
    summary: str
    main_topics: list[str]
    key_entities: list[str]
    notable_points: list[Point]


class ConsolidatedReport(BaseModel):
    """One report that covers all uploaded documents."""

    overview: str
    common_themes: list[str]
    key_differences: list[str]
    key_takeaways: list[SourcedPoint]


class Answer(BaseModel):
    """An answer to the analyst's question, based only on the documents."""

    answer: str
    sources: list[str]
    pages: list[int]
    found_in_documents: bool