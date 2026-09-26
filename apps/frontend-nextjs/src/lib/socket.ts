import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3003";

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
