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
