import * as grpc from '@grpc/grpc-js';
import { notifyUsersSafe } from '../core/notify';
import { emitGatePassEvent } from '../events/bus';
import type { Actor } from '../gate-pass/service';
import * as gatePassService from '../gate-pass/service';
import type { GatePassView } from '../gate-pass/types';

function actorFrom(req: {
  actorUserId?: string;
  actorPermissions?: string[];
}, call: grpc.ServerUnaryCall<any, any>): Actor {
  const metaToken = call.metadata.get('authorization')[0];
  const accessToken =
    typeof metaToken === 'string'
      ? metaToken
      : metaToken
        ? String(metaToken)
        : undefined;
  return {
    userId: req.actorUserId || '',
    permissions: req.actorPermissions ?? [],
    accessToken,
  };
}

function mapPass(view: GatePassView) {
  return {
    uid: view.uid,
    societyId: view.societyId,
    flatId: view.flatId ?? '',
    hasFlatId: view.flatId !== null,
    visitorName: view.visitorName,
    visitorPhone: view.visitorPhone ?? '',
    purpose: view.purpose ?? '',
    createdByUserId: view.createdByUserId,
    approvedByUserId: view.approvedByUserId ?? '',
    status: view.status,
    validFrom: view.validFrom,
    validUntil: view.validUntil,
    qrPayload: view.qrPayload ?? '',
    hasQrPayload: view.qrPayload !== null,
    usedAt: view.usedAt ?? '',
    rejectedReason: view.rejectedReason ?? '',
    createdAt: view.createdAt,
    updatedAt: view.updatedAt,
  };
}

function sendError(
  callback: grpc.sendUnaryData<unknown>,
  error: unknown,
) {
  const err = error as { code?: number; message?: string };
  callback({
    code: typeof err.code === 'number' ? err.code : grpc.status.INTERNAL,
    message: err.message || 'Internal error',
  } as grpc.ServiceError);
}

export const gatePassHandlers = {
  createGatePass(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const req = call.request;
    const actor = actorFrom(req, call);
    void gatePassService
      .createGatePass(
        {
          societyId: req.societyId,
          flatId: req.hasFlatId ? req.flatId : undefined,
          visitorName: req.visitorName,
          visitorPhone: req.visitorPhone || undefined,
          purpose: req.purpose || undefined,
          validFrom: req.validFrom || undefined,
          validUntil: req.validUntil || undefined,
        },
        actor,
      )
      .then((pass) => {
        emitGatePassEvent('gate_pass.created', pass);
        notifyUsersSafe({
          userIds: [pass.createdByUserId],
          societyId: pass.societyId,
          type:
            pass.status === 'APPROVED'
              ? 'GATE_PASS_APPROVED'
              : 'GATE_PASS_CREATED',
          title:
            pass.status === 'APPROVED'
              ? 'Gate pass approved'
              : 'Gate pass created',
          body: `${pass.visitorName} · ${pass.status}`,
          payload: { gatePassId: pass.uid },
        });
        callback(null, mapPass(pass));
      })
      .catch((error) => sendError(callback, error));
  },

  getGatePass(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const req = call.request;
    void gatePassService
      .getGatePass(req.uid, actorFrom(req, call))
      .then((pass) => callback(null, mapPass(pass)))
      .catch((error) => sendError(callback, error));
  },

  listGatePasses(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const req = call.request;
    void gatePassService
      .listPasses(
        req.societyId,
        actorFrom(req, call),
        req.hasStatus ? req.status : undefined,
      )
      .then((passes) =>
        callback(null, { gatePasses: passes.map(mapPass) }),
      )
      .catch((error) => sendError(callback, error));
  },

  approveGatePass(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const req = call.request;
    void gatePassService
      .approveGatePass(req.uid, actorFrom(req, call))
      .then((pass) => {
        emitGatePassEvent('gate_pass.updated', pass);
        notifyUsersSafe({
          userIds: [pass.createdByUserId],
          societyId: pass.societyId,
          type: 'GATE_PASS_APPROVED',
          title: 'Gate pass approved',
          body: `${pass.visitorName} is approved`,
          payload: { gatePassId: pass.uid },
        });
        callback(null, mapPass(pass));
      })
      .catch((error) => sendError(callback, error));
  },

  rejectGatePass(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const req = call.request;
    void gatePassService
      .rejectGatePass(req.uid, req.reason, actorFrom(req, call))
      .then((pass) => {
        emitGatePassEvent('gate_pass.updated', pass);
        notifyUsersSafe({
          userIds: [pass.createdByUserId],
          societyId: pass.societyId,
          type: 'GATE_PASS_REJECTED',
          title: 'Gate pass rejected',
          body: `${pass.visitorName}: ${pass.rejectedReason || 'Rejected'}`,
          payload: { gatePassId: pass.uid },
        });
        callback(null, mapPass(pass));
      })
      .catch((error) => sendError(callback, error));
  },

  cancelGatePass(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const req = call.request;
    void gatePassService
      .cancelGatePass(req.uid, actorFrom(req, call))
      .then((pass) => {
        emitGatePassEvent('gate_pass.updated', pass);
        callback(null, mapPass(pass));
      })
      .catch((error) => sendError(callback, error));
  },

  verifyQr(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ) {
    const req = call.request;
    void gatePassService
      .verifyQr(req.qrPayload, actorFrom(req, call))
      .then((result) => {
        if (result.valid && result.gatePass) {
          emitGatePassEvent('gate_pass.scanned', result.gatePass);
          notifyUsersSafe({
            userIds: [result.gatePass.createdByUserId],
            societyId: result.gatePass.societyId,
            type: 'GATE_PASS_SCANNED',
            title: 'Gate pass used',
            body: `${result.gatePass.visitorName} entered`,
            payload: { gatePassId: result.gatePass.uid },
          });
        }
        callback(null, {
          valid: result.valid,
          message: result.message,
          gatePass: result.gatePass ? mapPass(result.gatePass) : undefined,
          hasGatePass: Boolean(result.gatePass),
        });
      })
      .catch((error) => sendError(callback, error));
  },
};
