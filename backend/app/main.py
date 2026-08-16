from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import verses, memorization, auth, bookmarks

app = FastAPI(
    title="Quran Study Companion API",
    version="0.1.0",
    description="Backend for verse search, bookmarking, tafsir lookup, and memorization tracking.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server; tighten for prod
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(verses.router)
app.include_router(bookmarks.router)
app.include_router(memorization.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
