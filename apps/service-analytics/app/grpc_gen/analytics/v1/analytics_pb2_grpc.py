# Hand-maintained gRPC stub for analytics services.
import grpc
from app.grpc_gen.analytics.v1 import analytics_pb2 as analytics_dot_v1_dot_analytics__pb2


class ReceiptPdfServiceStub:
    def __init__(self, channel):
        self.GenerateReceiptPdf = channel.unary_unary(
            '/society.analytics.v1.ReceiptPdfService/GenerateReceiptPdf',
            request_serializer=analytics_dot_v1_dot_analytics__pb2.GenerateReceiptPdfRequest.SerializeToString,
            response_deserializer=analytics_dot_v1_dot_analytics__pb2.GenerateReceiptPdfResponse.FromString,
            _registered_method=True,
        )


class ReceiptPdfServiceServicer:
    def GenerateReceiptPdf(self, request, context):
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_ReceiptPdfServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
        'GenerateReceiptPdf': grpc.unary_unary_rpc_method_handler(
            servicer.GenerateReceiptPdf,
            request_deserializer=analytics_dot_v1_dot_analytics__pb2.GenerateReceiptPdfRequest.FromString,
            response_serializer=analytics_dot_v1_dot_analytics__pb2.GenerateReceiptPdfResponse.SerializeToString,
        ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
        'society.analytics.v1.ReceiptPdfService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    try:
        server.add_registered_method_handlers('society.analytics.v1.ReceiptPdfService', rpc_method_handlers)
    except AttributeError:
        pass


class InsightsServiceStub:
    def __init__(self, channel):
        self.GenerateSocietyInsights = channel.unary_unary(
            '/society.analytics.v1.InsightsService/GenerateSocietyInsights',
            request_serializer=analytics_dot_v1_dot_analytics__pb2.GenerateSocietyInsightsRequest.SerializeToString,
            response_deserializer=analytics_dot_v1_dot_analytics__pb2.GenerateSocietyInsightsResponse.FromString,
            _registered_method=True,
        )


class InsightsServiceServicer:
    def GenerateSocietyInsights(self, request, context):
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_InsightsServiceServicer_to_server(servicer, server):
    rpc_method_handlers = {
        'GenerateSocietyInsights': grpc.unary_unary_rpc_method_handler(
            servicer.GenerateSocietyInsights,
            request_deserializer=analytics_dot_v1_dot_analytics__pb2.GenerateSocietyInsightsRequest.FromString,
            response_serializer=analytics_dot_v1_dot_analytics__pb2.GenerateSocietyInsightsResponse.SerializeToString,
        ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
        'society.analytics.v1.InsightsService', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))
    try:
        server.add_registered_method_handlers('society.analytics.v1.InsightsService', rpc_method_handlers)
    except AttributeError:
        pass
