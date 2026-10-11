from pydantic import BaseModel


class KeyDetails(BaseModel): 
    title: str 
    summary: str 
    main_topics: list[str]
    key_entities: list[str]
    notable_points: list[str]


class ConsolidatedReport(BaseModel):

    overview: str
    common_themes: list[str]
    key_differences: list[str]
    key_takeaways: list[str]