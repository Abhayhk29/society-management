"""gRPC health server for service-analytics."""

from concurrent import futures

import grpc

from app.grpc_gen.common.v1 import health_pb2, health_pb2_grpc


class HealthServicer(health_pb2_grpc.HealthServiceServicer):
    def Check(self, request, context):  # noqa: N802
        return health_pb2.HealthCheckResponse(
            status="ok",
            service="service-analytics",
        )


def start_grpc_server(url: str) -> grpc.Server:
    # grpc expects host:port; keep 0.0.0.0 as-is for dual-stack bind on Windows.
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    health_pb2_grpc.add_HealthServiceServicer_to_server(HealthServicer(), server)
    bound = server.add_insecure_port(url)
    if bound == 0:
        raise RuntimeError(f"Failed to bind gRPC server on {url}")
    server.start()
    print(f"service-analytics gRPC listening on {url}")
    return server
