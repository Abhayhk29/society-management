const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type RoleSummary = {
  uid: string;
  name: string;
  description?: string;
};

export type AuthUser = {
  uid: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles?: RoleSummary[];
  permissions?: string[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { message?: string | string[] }).message ??
      `Request failed (${res.status})`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }
  return data as T;
}

export function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function login(body: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function refresh(refreshToken: string) {
  return request<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function logout(refreshToken: string) {
  return request<{ revoked: boolean }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function forgotPassword(email: string) {
  return request<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string) {
  return request<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export function sendOtp(
  phoneNumber: string,
  purpose: "VERIFY_PHONE" | "LOGIN" | "RESET_PASSWORD",
  token?: string | null,
) {
  return request<{ message: string; expiresIn: number }>(
    "/auth/otp/send",
    {
      method: "POST",
      body: JSON.stringify({ phoneNumber, purpose }),
    },
    token,
  );
}

export function verifyOtp(
  body: {
    phoneNumber: string;
    purpose: "VERIFY_PHONE" | "LOGIN" | "RESET_PASSWORD";
    code: string;
    newPassword?: string;
  },
  token?: string | null,
) {
  return request<AuthResponse | { verified: boolean; message: string }>(
    "/auth/otp/verify",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token,
  );
}

export function me(token: string) {
  return request<AuthUser>("/auth/me", { method: "GET" }, token);
}

export type Society = {
  uid: string;
  name: string;
  code: string;
  isActive: boolean;
};

export type GatePass = {
  uid: string;
  societyId: string;
  flatId?: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  createdByUserId: string;
  approvedByUserId?: string;
  status: string;
  validFrom: string;
  validUntil: string;
  qrPayload?: string;
  hasQrPayload?: boolean;
  usedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
};

export function listSocieties(token: string) {
  return request<Society[]>("/societies", { method: "GET" }, token);
}

export function listGatePasses(
  societyId: string,
  token: string,
  status?: string,
) {
  const qs = new URLSearchParams({ societyId });
  if (status) qs.set("status", status);
  return request<GatePass[]>(`/gate-passes?${qs}`, { method: "GET" }, token);
}

export function createGatePass(
  body: {
    societyId: string;
    flatId?: string;
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    validFrom?: string;
    validUntil?: string;
  },
  token: string,
) {
  return request<GatePass>(
    "/gate-passes",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function getGatePass(uid: string, token: string) {
  return request<GatePass>(`/gate-passes/${uid}`, { method: "GET" }, token);
}

export function approveGatePass(uid: string, token: string) {
  return request<GatePass>(
    `/gate-passes/${uid}/approve`,
    { method: "POST", body: "{}" },
    token,
  );
}

export function rejectGatePass(uid: string, token: string, reason?: string) {
  return request<GatePass>(
    `/gate-passes/${uid}/reject`,
    { method: "POST", body: JSON.stringify({ reason }) },
    token,
  );
}

export function cancelGatePass(uid: string, token: string) {
  return request<GatePass>(
    `/gate-passes/${uid}/cancel`,
    { method: "POST", body: "{}" },
    token,
  );
}

export function verifyGatePassQr(qrPayload: string, token: string) {
  return request<{
    valid: boolean;
    message: string;
    gatePass?: GatePass;
    hasGatePass?: boolean;
  }>(
    "/gate-passes/verify-qr",
    { method: "POST", body: JSON.stringify({ qrPayload }) },
    token,
  );
}

export type Bill = {
  uid: string;
  societyId: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  paidAmount?: number;
  notes?: string;
};

export type Payment = {
  uid: string;
  billId: string;
  amount: number;
  method: string;
  reference?: string;
  receiptNumber?: string;
  hasReceipt?: boolean;
  status: string;
};

export type Notice = {
  uid: string;
  societyId: string;
  title: string;
  body: string;
  priority: string;
  isActive: boolean;
  publishedAt: string;
};

export type Complaint = {
  uid: string;
  societyId: string;
  category: string;
  title: string;
  description: string;
  status: string;
};

export type Visitor = {
  uid: string;
  societyId: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  expectedAt: string;
  status: string;
  gatePassId?: string;
};

export function listBills(societyId: string, token: string) {
  return request<Bill[]>(
    `/bills?societyId=${encodeURIComponent(societyId)}`,
    { method: "GET" },
    token,
  );
}

export function createBill(
  body: {
    societyId: string;
    title: string;
    amount: number;
    dueDate: string;
    category?: string;
    notes?: string;
  },
  token: string,
) {
  return request<Bill>(
    "/bills",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function payBill(
  billId: string,
  body: { amount: number; method: string; reference?: string },
  token: string,
) {
  return request<Payment>(
    `/bills/${billId}/pay`,
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function listNotices(societyId: string, token: string) {
  return request<Notice[]>(
    `/notices?societyId=${encodeURIComponent(societyId)}&activeOnly=true`,
    { method: "GET" },
    token,
  );
}

export function createNotice(
  body: {
    societyId: string;
    title: string;
    body: string;
    priority?: string;
  },
  token: string,
) {
  return request<Notice>(
    "/notices",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function listComplaints(societyId: string, token: string) {
  return request<Complaint[]>(
    `/complaints?societyId=${encodeURIComponent(societyId)}`,
    { method: "GET" },
    token,
  );
}

export function createComplaint(
  body: {
    societyId: string;
    category: string;
    title: string;
    description: string;
  },
  token: string,
) {
  return request<Complaint>(
    "/complaints",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function listVisitors(societyId: string, token: string) {
  return request<Visitor[]>(
    `/visitors?societyId=${encodeURIComponent(societyId)}`,
    { method: "GET" },
    token,
  );
}

export function createVisitor(
  body: {
    societyId: string;
    visitorName: string;
    expectedAt: string;
    visitorPhone?: string;
    purpose?: string;
  },
  token: string,
) {
  return request<Visitor>(
    "/visitors",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function checkInVisitor(uid: string, token: string) {
  return request<Visitor>(
    `/visitors/${uid}/check-in`,
    { method: "POST", body: "{}" },
    token,
  );
}

export function checkOutVisitor(uid: string, token: string) {
  return request<Visitor>(
    `/visitors/${uid}/check-out`,
    { method: "POST", body: "{}" },
    token,
  );
}

export type Vendor = {
  uid: string;
  displayName: string;
  companyName: string;
  contactPhone?: string;
  contactEmail?: string;
  categories: string;
  status: string;
  city?: string;
};

export type VendorDocument = {
  uid: string;
  vendorId: string;
  docType: string;
  label: string;
  referenceOrUrl: string;
  status: string;
};

export type WorkOrder = {
  uid: string;
  societyId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedVendorId?: string;
  costEstimate?: number;
  actualCost?: number;
};

export type WorkOrderQuote = {
  uid: string;
  workOrderId: string;
  vendorId: string;
  amount: number;
  status: string;
  notes?: string;
};

export type WorkOrderEvent = {
  uid: string;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  message?: string;
  createdAt: string;
};

export function listVendors(
  token: string,
  opts?: { societyId?: string; status?: string },
) {
  const q = new URLSearchParams();
  if (opts?.societyId) q.set("societyId", opts.societyId);
  if (opts?.status) q.set("status", opts.status);
  const qs = q.toString();
  return request<Vendor[]>(
    `/vendors${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    token,
  );
}

export function createVendor(
  body: {
    displayName: string;
    companyName: string;
    categories?: string;
    contactPhone?: string;
    contactEmail?: string;
    city?: string;
    submitNow?: boolean;
  },
  token: string,
) {
  return request<Vendor>(
    "/vendors",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function submitVendor(uid: string, token: string) {
  return request<Vendor>(
    `/vendors/${uid}/submit`,
    { method: "POST", body: "{}" },
    token,
  );
}

export function reviewVendor(
  uid: string,
  body: { approve: boolean; rejectionReason?: string },
  token: string,
) {
  return request<Vendor>(
    `/vendors/${uid}/review`,
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function assignVendorSociety(
  vendorId: string,
  societyId: string,
  token: string,
) {
  return request(
    `/vendors/${vendorId}/societies`,
    { method: "POST", body: JSON.stringify({ societyId }) },
    token,
  );
}

export function addVendorDocument(
  vendorId: string,
  body: {
    docType: string;
    label: string;
    referenceOrUrl: string;
  },
  token: string,
) {
  return request<VendorDocument>(
    `/vendors/${vendorId}/documents`,
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function listVendorDocuments(vendorId: string, token: string) {
  return request<VendorDocument[]>(
    `/vendors/${vendorId}/documents`,
    { method: "GET" },
    token,
  );
}

export function verifyVendorDocument(
  uid: string,
  approve: boolean,
  token: string,
) {
  return request<VendorDocument>(
    `/vendor-documents/${uid}/verify`,
    { method: "POST", body: JSON.stringify({ approve }) },
    token,
  );
}

export function listWorkOrders(societyId: string, token: string) {
  return request<WorkOrder[]>(
    `/work-orders?societyId=${encodeURIComponent(societyId)}`,
    { method: "GET" },
    token,
  );
}

export function createWorkOrder(
  body: {
    societyId: string;
    title: string;
    description: string;
    category?: string;
    priority?: string;
  },
  token: string,
) {
  return request<WorkOrder>(
    "/work-orders",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function assignWorkOrder(
  uid: string,
  vendorId: string,
  token: string,
) {
  return request<WorkOrder>(
    `/work-orders/${uid}/assign`,
    { method: "POST", body: JSON.stringify({ vendorId }) },
    token,
  );
}

export function startWorkOrder(uid: string, token: string) {
  return request<WorkOrder>(
    `/work-orders/${uid}/start`,
    { method: "POST", body: "{}" },
    token,
  );
}

export function completeWorkOrder(
  uid: string,
  body: { actualCost?: number; resolutionNotes?: string },
  token: string,
) {
  return request<WorkOrder>(
    `/work-orders/${uid}/complete`,
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function verifyWorkOrder(uid: string, token: string) {
  return request<WorkOrder>(
    `/work-orders/${uid}/verify`,
    { method: "POST", body: "{}" },
    token,
  );
}

export function proposeQuote(
  workOrderId: string,
  body: { vendorId: string; amount: number; notes?: string },
  token: string,
) {
  return request<WorkOrderQuote>(
    `/work-orders/${workOrderId}/quotes`,
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function listQuotes(workOrderId: string, token: string) {
  return request<WorkOrderQuote[]>(
    `/work-orders/${workOrderId}/quotes`,
    { method: "GET" },
    token,
  );
}

export function decideQuote(
  quoteId: string,
  accept: boolean,
  token: string,
) {
  return request<WorkOrderQuote>(
    `/work-order-quotes/${quoteId}/decide`,
    { method: "POST", body: JSON.stringify({ accept }) },
    token,
  );
}

export function listWorkOrderEvents(workOrderId: string, token: string) {
  return request<WorkOrderEvent[]>(
    `/work-orders/${workOrderId}/events`,
    { method: "GET" },
    token,
  );
}

export type AppNotification = {
  uid: string;
  userId: string;
  societyId?: string;
  channel: string;
  type: string;
  title: string;
  body: string;
  status: string;
  sourceService: string;
  createdAt: string;
  readAt?: string;
};

export type NotificationPreferences = {
  uid: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  mutedTypes: string;
};

export function listNotifications(
  token: string,
  opts?: { unreadOnly?: boolean },
) {
  const q = new URLSearchParams();
  if (opts?.unreadOnly) q.set("unreadOnly", "true");
  const qs = q.toString();
  return request<AppNotification[]>(
    `/notifications${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    token,
  );
}

export function getUnreadCount(token: string) {
  return request<{ count: number }>(
    "/notifications/unread-count",
    { method: "GET" },
    token,
  );
}

export function markNotificationRead(uid: string, token: string) {
  return request<AppNotification>(
    `/notifications/${uid}/read`,
    { method: "POST", body: "{}" },
    token,
  );
}

export function markAllNotificationsRead(token: string) {
  return request<{ updatedCount: number }>(
    "/notifications/read-all",
    { method: "POST", body: "{}" },
    token,
  );
}

export function getNotificationPreferences(token: string) {
  return request<NotificationPreferences>(
    "/notifications/preferences/me",
    { method: "GET" },
    token,
  );
}

export function updateNotificationPreferences(
  body: Partial<{
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    mutedTypes: string;
  }>,
  token: string,
) {
  return request<NotificationPreferences>(
    "/notifications/preferences/me",
    { method: "PATCH", body: JSON.stringify(body) },
    token,
  );
}

export type Receipt = {
  uid: string;
  paymentId: string;
  billId: string;
  societyId: string;
  receiptNumber: string;
  issuedAt: string;
};

export type SocietyInsight = {
  category: string;
  title: string;
  detail: string;
  severity: string;
  score: number;
};

export type SocietyInsightsResponse = {
  societyId: string;
  summary: string;
  insights: SocietyInsight[];
  generatedAt: string;
  model: string;
};

export function listReceipts(societyId: string, token: string) {
  return request<Receipt[]>(
    `/receipts?societyId=${encodeURIComponent(societyId)}`,
    { method: "GET" },
    token,
  );
}

export async function downloadReceiptPdf(receiptId: string, token: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const res = await fetch(`${base}/receipts/${receiptId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `PDF download failed (${res.status})`);
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? `receipt-${receiptId}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getSocietyInsights(societyId: string, token: string) {
  return request<SocietyInsightsResponse>(
    `/analytics/insights/${encodeURIComponent(societyId)}`,
    { method: "GET" },
    token,
  );
}

/* ——— RBAC admin APIs ——— */

export type ManagedUser = {
  uid: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles?: RoleSummary[];
  permissions?: string[];
};

export type ManagedRole = {
  uid: string;
  name: string;
  description?: string;
  createdAt?: string;
};

export type ManagedPermission = {
  uid: string;
  action: string;
  module: string;
  description?: string;
};

export type UserRoleItem = {
  uid: string;
  assignedAt?: string;
  role: RoleSummary;
};

export type RolePermissionItem = {
  uid: string;
  assignedAt?: string;
  permission: ManagedPermission;
};

export function listUsers(token: string) {
  return request<ManagedUser[]>("/users", { method: "GET" }, token);
}

export function createUser(
  body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isActive?: boolean;
  },
  token: string,
) {
  return request<ManagedUser>(
    "/users",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function updateUser(
  uid: string,
  body: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    isActive: boolean;
  }>,
  token: string,
) {
  return request<ManagedUser>(
    `/users/${uid}`,
    { method: "PATCH", body: JSON.stringify(body) },
    token,
  );
}

export function deleteUser(uid: string, token: string) {
  return request<{ removed: boolean; uid: string }>(
    `/users/${uid}`,
    { method: "DELETE" },
    token,
  );
}

export function listUserRoles(uid: string, token: string) {
  return request<{ items: UserRoleItem[] } | UserRoleItem[]>(
    `/users/${uid}/roles`,
    { method: "GET" },
    token,
  ).then((res) => (Array.isArray(res) ? res : (res.items ?? [])));
}

export function assignUserRole(uid: string, roleId: string, token: string) {
  return request(
    `/users/${uid}/roles`,
    { method: "POST", body: JSON.stringify({ roleId }) },
    token,
  );
}

export function removeUserRole(uid: string, roleId: string, token: string) {
  return request(
    `/users/${uid}/roles/${roleId}`,
    { method: "DELETE" },
    token,
  );
}

export function listRoles(token: string) {
  return request<ManagedRole[]>("/roles", { method: "GET" }, token);
}

export function createRole(
  body: { name: string; description?: string },
  token: string,
) {
  return request<ManagedRole>(
    "/roles",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function updateRole(
  uid: string,
  body: Partial<{ name: string; description: string | null }>,
  token: string,
) {
  return request<ManagedRole>(
    `/roles/${uid}`,
    { method: "PATCH", body: JSON.stringify(body) },
    token,
  );
}

export function deleteRole(uid: string, token: string) {
  return request<{ removed: boolean; uid: string }>(
    `/roles/${uid}`,
    { method: "DELETE" },
    token,
  );
}

export function listRolePermissions(uid: string, token: string) {
  return request<{ items: RolePermissionItem[] } | RolePermissionItem[]>(
    `/roles/${uid}/permissions`,
    { method: "GET" },
    token,
  ).then((res) => (Array.isArray(res) ? res : (res.items ?? [])));
}

export function assignRolePermission(
  roleId: string,
  permissionId: string,
  token: string,
) {
  return request(
    `/roles/${roleId}/permissions`,
    { method: "POST", body: JSON.stringify({ permissionId }) },
    token,
  );
}

export function removeRolePermission(
  roleId: string,
  permissionId: string,
  token: string,
) {
  return request(
    `/roles/${roleId}/permissions/${permissionId}`,
    { method: "DELETE" },
    token,
  );
}

export function listPermissions(token: string) {
  return request<ManagedPermission[]>(
    "/permissions",
    { method: "GET" },
    token,
  );
}

export function createPermission(
  body: { action: string; module: string; description?: string },
  token: string,
) {
  return request<ManagedPermission>(
    "/permissions",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
}

export function updatePermission(
  uid: string,
  body: Partial<{
    action: string;
    module: string;
    description: string | null;
  }>,
  token: string,
) {
  return request<ManagedPermission>(
    `/permissions/${uid}`,
    { method: "PATCH", body: JSON.stringify(body) },
    token,
  );
}

export function deletePermission(uid: string, token: string) {
  return request<{ removed: boolean; uid: string }>(
    `/permissions/${uid}`,
    { method: "DELETE" },
    token,
  );
}
