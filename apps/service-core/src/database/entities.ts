import { OtpCode } from '../auth/entities/otp-code.entity.js';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';
import { Bill } from '../billing/entities/bill.entity.js';
import { Payment } from '../billing/entities/payment.entity.js';
import { Receipt } from '../billing/entities/receipt.entity.js';
import { Complaint } from '../community/entities/complaint.entity.js';
import { Notice } from '../community/entities/notice.entity.js';
import { Visitor } from '../community/entities/visitor.entity.js';
import { NotificationPreference } from '../notifications/entities/notification-preference.entity.js';
import { Notification } from '../notifications/entities/notification.entity.js';
import { Building } from '../society/entities/building.entity.js';
import { Flat } from '../society/entities/flat.entity.js';
import { Membership } from '../society/entities/membership.entity.js';
import { Society } from '../society/entities/society.entity.js';
import { Permission } from '../user/entities/permission.entity.js';
import { RolePermission } from '../user/entities/role-permission.entity.js';
import { Role } from '../user/entities/role.entity.js';
import { UserRole } from '../user/entities/user-role.entity.js';
import { User } from '../user/entities/user.entity.js';
import { VendorDocument } from '../vendor/entities/vendor-document.entity.js';
import { VendorSociety } from '../vendor/entities/vendor-society.entity.js';
import { Vendor } from '../vendor/entities/vendor.entity.js';
import { WorkOrderEvent } from '../vendor/entities/work-order-event.entity.js';
import { WorkOrderQuote } from '../vendor/entities/work-order-quote.entity.js';
import { WorkOrder } from '../vendor/entities/work-order.entity.js';

/** Explicit entity list for TypeORM CLI data-source and migrations. */
export const coreEntities = [
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  RefreshToken,
  PasswordResetToken,
  OtpCode,
  Society,
  Building,
  Flat,
  Membership,
  Bill,
  Payment,
  Receipt,
  Notice,
  Complaint,
  Visitor,
  Vendor,
  VendorDocument,
  VendorSociety,
  WorkOrder,
  WorkOrderQuote,
  WorkOrderEvent,
  Notification,
  NotificationPreference,
];
