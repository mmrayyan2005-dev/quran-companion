from app.schemas.verse import TafsirOut


def test_tafsir_out_accepts_valid_data():
    t = TafsirOut(id=1, source_name="Ibn Kathir (Abridged)", text="Some commentary text.")
    assert t.source_name == "Ibn Kathir (Abridged)"
    assert t.text == "Some commentary text."


def test_tafsir_out_requires_all_fields():
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        TafsirOut(id=1, source_name="Ibn Kathir (Abridged)")  # missing text
