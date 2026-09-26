# -*- coding: utf-8 -*-
# Hand-maintained stub (protoc DLL blocked on this host). Source: analytics/v1/analytics.proto
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC, 7, 35, 1, '', 'analytics/v1/analytics.proto'
)
_sym_db = _symbol_database.Default()
DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x1canalytics/v1/analytics.proto\x12\x14society.analytics.v1"\x85\x01\n\x19GenerateReceiptPdfRequest\x12\x16\n\x0ereceipt_number\x18\x01 \x01(\t\x12\x11\n\tissued_at\x18\x02 \x01(\t\x12\x12\n\nsociety_id\x18\x03 \x01(\t\x12\x15\n\rsnapshot_json\x18\x04 \x01(\t\x12\x12\n\nbrand_name\x18\x05 \x01(\t"W\n\x1aGenerateReceiptPdfResponse\x12\x11\n\tpdf_bytes\x18\x01 \x01(\x0c\x12\x10\n\x08filename\x18\x02 \x01(\t\x12\x14\n\x0ccontent_type\x18\x03 \x01(\t"\xe2\x02\n\x1eGenerateSocietyInsightsRequest\x12\x12\n\nsociety_id\x18\x01 \x01(\t\x12\x14\n\x0csociety_name\x18\x02 \x01(\t\x12\x13\n\x0bbills_total\x18\x03 \x01(\x05\x12\x12\n\nbills_paid\x18\x04 \x01(\x05\x12\x15\n\rbills_overdue\x18\x05 \x01(\x05\x12\x19\n\x11revenue_collected\x18\x06 \x01(\x01\x12\x1b\n\x13revenue_outstanding\x18\x07 \x01(\x01\x12\x17\n\x0fcomplaints_open\x18\x08 \x01(\x05\x12\x1b\n\x13complaints_resolved\x18\t \x01(\x05\x12\x18\n\x10work_orders_open\x18\n \x01(\x05\x12\x1d\n\x15work_orders_completed\x18\x0b \x01(\x05\x12\x19\n\x11visitors_expected\x18\x0c \x01(\x05\x12\x14\n\x0cperiod_label\x18\r \x01(\t"_\n\x0bInsightItem\x12\x10\n\x08category\x18\x01 \x01(\t\x12\r\n\x05title\x18\x02 \x01(\t\x12\x0e\n\x06detail\x18\x03 \x01(\t\x12\x10\n\x08severity\x18\x04 \x01(\t\x12\r\n\x05score\x18\x05 \x01(\x01"\xa0\x01\n\x1fGenerateSocietyInsightsResponse\x12\x12\n\nsociety_id\x18\x01 \x01(\t\x12\x0f\n\x07summary\x18\x02 \x01(\t\x123\n\x08insights\x18\x03 \x03(\x0b2!.society.analytics.v1.InsightItem\x12\x14\n\x0cgenerated_at\x18\x04 \x01(\t\x12\r\n\x05model\x18\x05 \x01(\t2\x8c\x01\n\x11ReceiptPdfService\x12w\n\x12GenerateReceiptPdf\x12/.society.analytics.v1.GenerateReceiptPdfRequest\x1a0.society.analytics.v1.GenerateReceiptPdfResponse2\x9a\x01\n\x0fInsightsService\x12\x86\x01\n\x17GenerateSocietyInsights\x124.society.analytics.v1.GenerateSocietyInsightsRequest\x1a5.society.analytics.v1.GenerateSocietyInsightsResponseb\x06proto3')
_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'analytics.v1.analytics_pb2', _globals)
