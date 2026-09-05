import pytest
from pydantic import ValidationError

from app.schemas.hadith import HadithCollectionOut, HadithOut


def test_hadith_collection_out_accepts_valid_data():
    c = HadithCollectionOut(
        id=1, key="bukhari", name="Sahih al-Bukhari", arabic_name="صحيح البخاري",
        author="Imam Bukhari", reliability="Sahih", total_hadiths=7580,
    )
    assert c.key == "bukhari"
    assert c.total_hadiths == 7580


def test_hadith_collection_out_allows_optional_fields_to_be_none():
    c = HadithCollectionOut(
        id=1, key="bukhari", name="Sahih al-Bukhari", arabic_name=None,
        author=None, reliability=None, total_hadiths=7580,
    )
    assert c.arabic_name is None


def test_hadith_out_requires_english_text():
    with pytest.raises(ValidationError):
        HadithOut(id=1, hadith_number=1, text_arabic="...", text_english=None, grade="Sahih")


def test_hadith_out_allows_missing_arabic_and_grade():
    h = HadithOut(id=1, hadith_number=1, text_arabic=None, text_english="Some hadith text.", grade=None)
    assert h.text_arabic is None
    assert h.grade is None
