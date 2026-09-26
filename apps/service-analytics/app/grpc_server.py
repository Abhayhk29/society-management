"""gRPC server for service-analytics (health + PDF + insights)."""

from concurrent import futures

import grpc

from app.grpc_gen.analytics.v1 import analytics_pb2, analytics_pb2_grpc
from app.grpc_gen.common.v1 import health_pb2, health_pb2_grpc
from app.services.insights import generate_society_insights
from app.services.pdf_receipt import generate_receipt_pdf


class HealthServicer(health_pb2_grpc.HealthServiceServicer):
    def Check(self, request, context):  # noqa: N802
        return health_pb2.HealthCheckResponse(
            status="ok",
            service="service-analytics",
        )


class ReceiptPdfServicer(analytics_pb2_grpc.ReceiptPdfServiceServicer):
    def GenerateReceiptPdf(self, request, context):  # noqa: N802
        try:
            pdf_bytes, filename = generate_receipt_pdf(
                receipt_number=request.receipt_number,
                issued_at=request.issued_at,
                society_id=request.society_id,
                snapshot_json=request.snapshot_json,
                brand_name=request.brand_name or "Nivas",
            )
            return analytics_pb2.GenerateReceiptPdfResponse(
                pdf_bytes=pdf_bytes,
                filename=filename,
                content_type="application/pdf",
            )
        except Exception as exc:  # noqa: BLE001
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(exc))
            return analytics_pb2.GenerateReceiptPdfResponse()


class InsightsServicer(analytics_pb2_grpc.InsightsServiceServicer):
    def GenerateSocietyInsights(self, request, context):  # noqa: N802
        try:
            result = generate_society_insights(
                {
                    "society_id": request.society_id,
                    "society_name": request.society_name,
                    "bills_total": request.bills_total,
                    "bills_paid": request.bills_paid,
                    "bills_overdue": request.bills_overdue,
                    "revenue_collected": request.revenue_collected,
                    "revenue_outstanding": request.revenue_outstanding,
                    "complaints_open": request.complaints_open,
                    "complaints_resolved": request.complaints_resolved,
                    "work_orders_open": request.work_orders_open,
                    "work_orders_completed": request.work_orders_completed,
                    "visitors_expected": request.visitors_expected,
                    "period_label": request.period_label or "current period",
                }
            )
            return analytics_pb2.GenerateSocietyInsightsResponse(
                society_id=result["society_id"],
                summary=result["summary"],
                insights=[
                    analytics_pb2.InsightItem(
                        category=i["category"],
                        title=i["title"],
                        detail=i["detail"],
                        severity=i["severity"],
                        score=i["score"],
                    )
                    for i in result["insights"]
                ],
                generated_at=result["generated_at"],
                model=result["model"],
            )
        except Exception as exc:  # noqa: BLE001
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(exc))
            return analytics_pb2.GenerateSocietyInsightsResponse()


def start_grpc_server(url: str) -> grpc.Server:
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=8))
    health_pb2_grpc.add_HealthServiceServicer_to_server(HealthServicer(), server)
    analytics_pb2_grpc.add_ReceiptPdfServiceServicer_to_server(
        ReceiptPdfServicer(), server
    )
    analytics_pb2_grpc.add_InsightsServiceServicer_to_server(
        InsightsServicer(), server
    )
    bound = server.add_insecure_port(url)
    if bound == 0:
        raise RuntimeError(f"Failed to bind gRPC server on {url}")
    server.start()
    print(f"service-analytics gRPC listening on {url}")
    return server
