from fastapi import FastAPI
from .core.config import get_settings

settings = get_settings()
app = FastAPI(title=settings.APP_NAME)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/")
def root():
    return {"message": "Backend is running.", "docs": "/docs"}

