from fastapi import Depends, FastAPI

from app.config import Settings, get_settings

app = FastAPI(
    title="service-analytics",
    description="PDF generation and AI analytics service",
    version="0.0.1",
)


@app.get("/health")
async def health(settings: Settings = Depends(get_settings)):
    return {
        "status": "ok",
        "service": "service-analytics",
        "port": settings.port,
    }
