import type { AuthUser } from "./api";

export type AppRole = "ADMIN" | "RESIDENT" | "GUARD" | "VENDOR" | "OTHER";

const ROLE_PRIORITY: AppRole[] = [
  "ADMIN",
  "GUARD",
  "RESIDENT",
  "VENDOR",
  "OTHER",
];

export function hasPermission(
  user: AuthUser | null | undefined,
  action: string,
): boolean {
  return Boolean(user?.permissions?.includes(action));
}

export function hasAnyPermission(
  user: AuthUser | null | undefined,
  actions: string[],
): boolean {
  return actions.some((action) => hasPermission(user, action));
}

export function hasRole(
  user: AuthUser | null | undefined,
  roleName: string,
): boolean {
  return Boolean(
    user?.roles?.some(
      (role) => role.name?.toUpperCase() === roleName.toUpperCase(),
    ),
  );
}

/** Highest-priority role for dashboard personalization. */
export function primaryRole(user: AuthUser | null | undefined): AppRole {
  const names = new Set(
    (user?.roles ?? []).map((r) => r.name?.toUpperCase()).filter(Boolean),
  );
  for (const role of ROLE_PRIORITY) {
    if (role !== "OTHER" && names.has(role)) {
      return role;
    }
  }
  return "OTHER";
}

export type NavLink = {
  href: string;
  label: string;
  /** Permission any-of gate; omit to always show when listed for the role. */
  permissions?: string[];
};

export function dashboardLinksForRole(role: AppRole): NavLink[] {
  const common: NavLink[] = [
    {
      href: "/notifications",
      label: "Notifications",
      permissions: ["view:notification"],
    },
  ];

  if (role === "ADMIN") {
    return [
      { href: "/admin/users", label: "Users", permissions: ["view:user"] },
      {
        href: "/admin/roles",
        label: "Roles",
        permissions: ["manage:roles"],
      },
      {
        href: "/admin/permissions",
        label: "Permissions",
        permissions: ["manage:permissions"],
      },
      {
        href: "/gate-passes",
        label: "Gate passes",
        permissions: ["view:gate_pass"],
      },
      { href: "/billing", label: "Billing", permissions: ["view:bills"] },
      {
        href: "/community",
        label: "Community",
        permissions: ["view:notice", "view:complaint", "view:visitor"],
      },
      { href: "/vendors", label: "Vendors", permissions: ["view:vendor"] },
      {
        href: "/work-orders",
        label: "Work orders",
        permissions: ["view:work_order"],
      },
      {
        href: "/insights",
        label: "Insights",
        permissions: ["view:analytics"],
      },
      ...common,
    ];
  }

  if (role === "GUARD") {
    return [
      {
        href: "/gate-passes",
        label: "Gate desk",
        permissions: ["view:gate_pass"],
      },
      {
        href: "/community",
        label: "Visitors & notices",
        permissions: ["view:visitor", "view:notice"],
      },
      {
        href: "/work-orders",
        label: "Work orders",
        permissions: ["view:work_order"],
      },
      ...common,
    ];
  }

  // RESIDENT / VENDOR / OTHER — resident-leaning defaults
  return [
    {
      href: "/gate-passes",
      label: "Gate passes",
      permissions: ["view:gate_pass"],
    },
    { href: "/billing", label: "Billing", permissions: ["view:bills"] },
    {
      href: "/community",
      label: "Community",
      permissions: ["view:notice", "view:complaint", "view:visitor"],
    },
    {
      href: "/work-orders",
      label: "Work orders",
      permissions: ["view:work_order"],
    },
    { href: "/vendors", label: "Vendors", permissions: ["view:vendor"] },
    {
      href: "/insights",
      label: "Insights",
      permissions: ["view:analytics"],
    },
    ...common,
  ];
}

export function filterNavLinks(
  links: NavLink[],
  user: AuthUser | null | undefined,
): NavLink[] {
  return links.filter((link) => {
    if (!link.permissions?.length) return true;
    return hasAnyPermission(user, link.permissions);
  });
}

export function roleHeadline(role: AppRole): { title: string; blurb: string } {
  switch (role) {
    case "ADMIN":
      return {
        title: "Admin console",
        blurb: "Manage people, access, and society operations from one place.",
      };
    case "GUARD":
      return {
        title: "Guard desk",
        blurb: "Approve passes, scan QR codes, and keep the gate moving.",
      };
    case "RESIDENT":
      return {
        title: "Resident home",
        blurb: "Your bills, visitors, notices, and service requests.",
      };
    case "VENDOR":
      return {
        title: "Vendor workspace",
        blurb: "Track assigned work orders and gate access for jobs.",
      };
    default:
      return {
        title: "Your workspace",
        blurb: "Open the tools you have permission to use.",
      };
  }
}
