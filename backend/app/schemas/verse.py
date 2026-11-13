from pydantic import BaseModel, ConfigDict, field_validator


class SurahOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name_arabic: str
    name_english: str
    name_transliteration: str
    revelation_place: str
    verse_count: int

    @field_validator("id")
    @classmethod
    def valid_surah_number(cls, v: int) -> int:
        if not (1 <= v <= 114):
            raise ValueError("Surah id must be between 1 and 114")
        return v


class TafsirOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_name: str
    text: str


class VerseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    surah_id: int
    ayah_number: int
    text_arabic: str
    text_transliteration: str | None
    text_translation_en: str
    text_translation_ur: str | None = None
    juz_number: int
    page_number: int

    @field_validator("ayah_number")
    @classmethod
    def positive_ayah(cls, v: int) -> int:
        if v < 1:
            raise ValueError("ayah_number must be positive")
        return v

    @field_validator("juz_number")
    @classmethod
    def valid_juz(cls, v: int) -> int:
        if not (1 <= v <= 30):
            raise ValueError("juz_number must be between 1 and 30")
        return v


class VerseSearchResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    verse: VerseOut
    surah_name_english: str
    match_snippet: str


class JuzVerseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    verse: VerseOut
    surah_name_english: str
    surah_name_transliteration: str
