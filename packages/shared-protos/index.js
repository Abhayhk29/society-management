const { join } = require('path');

const protoRoot = join(__dirname, 'proto');
const healthProto = join(protoRoot, 'common', 'v1', 'health.proto');
const userProto = join(protoRoot, 'core', 'v1', 'user.proto');
const societyProto = join(protoRoot, 'core', 'v1', 'society.proto');
const billingProto = join(protoRoot, 'core', 'v1', 'billing.proto');
const communityProto = join(protoRoot, 'core', 'v1', 'community.proto');
const vendorProto = join(protoRoot, 'core', 'v1', 'vendor.proto');
const notificationProto = join(protoRoot, 'core', 'v1', 'notification.proto');
const gatePassProto = join(protoRoot, 'realtime', 'v1', 'gate_pass.proto');
const analyticsProto = join(protoRoot, 'analytics', 'v1', 'analytics.proto');

module.exports = {
  protoRoot,
  healthProto,
  userProto,
  societyProto,
  billingProto,
  communityProto,
  vendorProto,
  notificationProto,
  gatePassProto,
  analyticsProto,
  HEALTH_PACKAGE: 'society.common.v1',
  HEALTH_SERVICE: 'HealthService',
  CORE_PACKAGE: 'society.core.v1',
  USER_SERVICE: 'UserService',
  ROLE_SERVICE: 'RoleService',
  PERMISSION_SERVICE: 'PermissionService',
  AUTH_SERVICE: 'AuthService',
  SOCIETY_SERVICE: 'SocietyService',
  BUILDING_SERVICE: 'BuildingService',
  FLAT_SERVICE: 'FlatService',
  MEMBERSHIP_SERVICE: 'MembershipService',
  BILL_SERVICE: 'BillService',
  PAYMENT_SERVICE: 'PaymentService',
  RECEIPT_SERVICE: 'ReceiptService',
  NOTICE_SERVICE: 'NoticeService',
  COMPLAINT_SERVICE: 'ComplaintService',
  VISITOR_SERVICE: 'VisitorService',
  VENDOR_SERVICE: 'VendorService',
  WORK_ORDER_SERVICE: 'WorkOrderService',
  NOTIFICATION_SERVICE: 'NotificationService',
  REALTIME_PACKAGE: 'society.realtime.v1',
  GATE_PASS_SERVICE: 'GatePassService',
  ANALYTICS_PACKAGE: 'society.analytics.v1',
  RECEIPT_PDF_SERVICE: 'ReceiptPdfService',
  INSIGHTS_SERVICE: 'InsightsService',
};
