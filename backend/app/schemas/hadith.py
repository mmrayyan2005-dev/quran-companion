from pydantic import BaseModel, ConfigDict


class HadithCollectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    name: str
    arabic_name: str | None
    author: str | None
    reliability: str | None
    total_hadiths: int


class HadithBookOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    book_number: int
    book_name: str


class HadithOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hadith_number: int
    text_arabic: str | None
    text_english: str
    grade: str | None
    book_number: int | None = None
    book_name: str | None = None


class HadithSearchResult(BaseModel):
    hadith: HadithOut
    collection_name: str
    collection_key: str
    match_snippet: str
