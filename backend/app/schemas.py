from pydantic import BaseModel


class KeyDetails(BaseModel): 
    title: str 
    summary: str 
    main_topics: list[str]
    key_entities: list[str]
    notable_points: list[str]