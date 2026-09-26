from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.config import Settings, get_settings
from app.grpc_server import start_grpc_server
from app.services.insights import generate_society_insights
from app.services.pdf_receipt import generate_receipt_pdf


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
    version="0.1.0",
    lifespan=lifespan,
)


class ReceiptPdfBody(BaseModel):
    receipt_number: str
    issued_at: str = ""
    society_id: str = ""
    snapshot_json: str = "{}"
    brand_name: str = "Nivas"


class InsightsBody(BaseModel):
    society_id: str
    society_name: str = "Society"
    bills_total: int = 0
    bills_paid: int = 0
    bills_overdue: int = 0
    revenue_collected: float = 0
    revenue_outstanding: float = 0
    complaints_open: int = 0
    complaints_resolved: int = 0
    work_orders_open: int = 0
    work_orders_completed: int = 0
    visitors_expected: int = 0
    period_label: str = "current period"


@app.get("/health")
async def health(settings: Settings = Depends(get_settings)):
    return {
        "status": "ok",
        "service": "service-analytics",
        "port": settings.port,
        "grpc_url": settings.grpc_url,
        "capabilities": ["receipt-pdf", "society-insights", "grpc-health"],
    }


@app.get("/ready")
async def ready():
    return {
        "status": "ready",
        "service": "service-analytics",
    }


@app.post("/receipts/pdf")
async def receipt_pdf(body: ReceiptPdfBody):
    try:
        pdf_bytes, filename = generate_receipt_pdf(
            receipt_number=body.receipt_number,
            issued_at=body.issued_at,
            society_id=body.society_id,
            snapshot_json=body.snapshot_json,
            brand_name=body.brand_name,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/insights")
async def insights(body: InsightsBody):
    return generate_society_insights(body.model_dump())
