import type { Server } from 'socket.io';
import type { GatePassView } from '../gate-pass/types';

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export function emitGatePassEvent(
  event: 'gate_pass.created' | 'gate_pass.updated' | 'gate_pass.scanned',
  pass: GatePassView,
) {
  if (!io) return;
  io.to(`society:${pass.societyId}`).emit(event, pass);
  io.to(`user:${pass.createdByUserId}`).emit(event, pass);
}

export function emitNotificationEvent(notification: {
  uid: string;
  userId: string;
  title: string;
  body: string;
  type: string;
}) {
  if (!io) return;
  io.to(`user:${notification.userId}`).emit(
    'notification.created',
    notification,
  );
}
