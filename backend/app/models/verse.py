"""
Core Quran content models.

IMPORTANT (lesson from the cricket project): these tables are populated
ONLY by scripts/ingest_quran_data.py, pulling from a verified external
source. Never edit rows here by hand — that's exactly how the cricket
dashboard ended up with doubled run counts from stale manual overrides.
If the data is wrong, fix the ingestion script and re-run it.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class Surah(Base):
    __tablename__ = "surahs"

    id = Column(Integer, primary_key=True)  # 1-114, matches official numbering
    name_arabic = Column(String, nullable=False)
    name_english = Column(String, nullable=False)
    name_transliteration = Column(String, nullable=False)
    revelation_place = Column(String, nullable=False)  # "Makkah" | "Madinah"
    verse_count = Column(Integer, nullable=False)

    verses = relationship("Verse", back_populates="surah", order_by="Verse.ayah_number")


class Verse(Base):
    __tablename__ = "verses"
    __table_args__ = (UniqueConstraint("surah_id", "ayah_number", name="uq_surah_ayah"),)

    id = Column(Integer, primary_key=True)
    surah_id = Column(Integer, ForeignKey("surahs.id"), nullable=False)
    ayah_number = Column(Integer, nullable=False)  # verse number within the surah
    text_arabic = Column(Text, nullable=False)
    text_transliteration = Column(Text, nullable=True)
    text_translation_en = Column(Text, nullable=False)
    text_translation_ur = Column(Text, nullable=True)  # Urdu: Fateh Muhammad Jalandhry (ur.jalandhry)
    juz_number = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=False)

    surah = relationship("Surah", back_populates="verses")
    tafsirs = relationship("Tafsir", back_populates="verse")


class Tafsir(Base):
    __tablename__ = "tafsirs"

    id = Column(Integer, primary_key=True)
    verse_id = Column(Integer, ForeignKey("verses.id"), nullable=False)
    source_name = Column(String, nullable=False)  # e.g. "Ibn Kathir", "Maarif-ul-Quran"
    text = Column(Text, nullable=False)

    verse = relationship("Verse", back_populates="tafsirs")
