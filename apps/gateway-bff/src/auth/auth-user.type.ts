export type GatewayAuthUser = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles?: Array<{ uid: string; name: string; description?: string }>;
  permissions: string[];
};
