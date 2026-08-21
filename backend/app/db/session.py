from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.db.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=270,  # recycle connections before Supabase's pooler closes them from idling
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    Dependency-injected DB session for FastAPI routes.
    Ensures every request gets a fresh session that's always closed,
    even on error — no leaked connections.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
