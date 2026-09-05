"""
Hadith models. Same discipline as verse.py: these tables are populated
ONLY by scripts/ingest_hadith_data.py (and, for book categorization,
scripts/enrich_hadith_books.py) — never hand-edit rows.
"""
from sqlalchemy import Column, Integer, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.session import Base


class HadithCollection(Base):
    __tablename__ = "hadith_collections"

    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, nullable=False)  # e.g. "bukhari"
    name = Column(String, nullable=False)  # e.g. "Sahih al-Bukhari"
    arabic_name = Column(String, nullable=True)
    author = Column(String, nullable=True)
    reliability = Column(String, nullable=True)  # e.g. "Sahih", "Hasan/Sahih"
    total_hadiths = Column(Integer, nullable=False)

    hadiths = relationship("Hadith", back_populates="collection")


class HadithBook(Base):
    """
    A 'book' (Kitab) within a collection — the traditional topical
    division, e.g. "Prayer (Kitab Al-Salat)", "Fasting (Kitab Al-Siyam)".
    Populated by scripts/enrich_hadith_books.py from the source dataset's
    section metadata, applied on top of hadiths already ingested.
    """
    __tablename__ = "hadith_books"
    __table_args__ = (UniqueConstraint("collection_id", "book_number", name="uq_collection_book_number"),)

    id = Column(Integer, primary_key=True)
    collection_id = Column(Integer, ForeignKey("hadith_collections.id"), nullable=False)
    book_number = Column(Integer, nullable=False)
    book_name = Column(String, nullable=False)

    collection = relationship("HadithCollection")
    hadiths = relationship("Hadith", back_populates="book")


class Hadith(Base):
    __tablename__ = "hadiths"
    __table_args__ = (UniqueConstraint("collection_id", "hadith_number", name="uq_collection_hadith_number"),)

    id = Column(Integer, primary_key=True)
    collection_id = Column(Integer, ForeignKey("hadith_collections.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("hadith_books.id"), nullable=True)
    hadith_number = Column(Integer, nullable=False)
    text_arabic = Column(Text, nullable=True)
    text_english = Column(Text, nullable=False)
    grade = Column(String, nullable=True)  # e.g. "Sahih" — not always available

    collection = relationship("HadithCollection", back_populates="hadiths")
    book = relationship("HadithBook", back_populates="hadiths")
