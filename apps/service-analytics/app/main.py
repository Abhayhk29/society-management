from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from app.config import Settings, get_settings
from app.grpc_server import start_grpc_server


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    grpc_server = start_grpc_server(settings.grpc_url)
    try:
        yield
    finally:
        grpc_server.stop(grace=3)


app = FastAPI(
    title="service-analytics",
    description="PDF generation and AI analytics service",
    version="0.0.1",
    lifespan=lifespan,
)


@app.get("/health")
async def health(settings: Settings = Depends(get_settings)):
    return {
        "status": "ok",
        "service": "service-analytics",
        "port": settings.port,
        "grpc_url": settings.grpc_url,
    }
