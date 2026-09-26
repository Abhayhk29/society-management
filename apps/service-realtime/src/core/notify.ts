import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {
  NOTIFICATION_SERVICE,
  notificationProto,
  protoRoot,
  userProto,
} from 'shared-protos';
import { config } from '../config';
import { emitNotificationEvent } from '../events/bus';

type UnaryClient = {
  [method: string]: (
    req: unknown,
    metadata: grpc.Metadata,
    options: grpc.CallOptions | undefined,
    cb: (err: grpc.ServiceError | null, res: unknown) => void,
  ) => void;
};

let notificationClient: UnaryClient | null = null;

function loadClient() {
  if (notificationClient) return;
  const packageDefinition = protoLoader.loadSync(
    [userProto, notificationProto],
    {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [protoRoot],
    },
  );
  const proto = grpc.loadPackageDefinition(packageDefinition) as any;
  notificationClient = new proto.society.core.v1[NOTIFICATION_SERVICE](
    config.coreGrpcUrl,
    grpc.credentials.createInsecure(),
  );
}

/**
 * Enqueue durable notifications in service-core (email/SMS/push/in-app)
 * using the internal service key. Failures are logged, never thrown.
 */
export function notifyUsersSafe(input: {
  userIds: string[];
  societyId?: string;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}): void {
  if (!input.userIds.length) return;
  void (async () => {
    try {
      loadClient();
      if (!notificationClient) return;

      const metadata = new grpc.Metadata();
      metadata.set('x-service-key', config.internalServiceKey);

      const res = await new Promise<{
        notifications?: Array<{
          uid: string;
          userId: string;
          title: string;
          body: string;
          type: string;
          channel: string;
        }>;
      }>((resolve, reject) => {
        notificationClient!.enqueueNotification(
          {
            userIds: input.userIds,
            societyId: input.societyId ?? '',
            hasSocietyId: Boolean(input.societyId),
            type: input.type,
            title: input.title,
            body: input.body,
            payloadJson: input.payload
              ? JSON.stringify(input.payload)
              : '',
            channels: [],
            sourceService: 'realtime',
            actorUserId: '',
          },
          metadata,
          undefined,
          (err, response) => {
            if (err) reject(err);
            else resolve((response as typeof res) ?? {});
          },
        );
      });

      for (const n of res.notifications ?? []) {
        if (n.channel === 'IN_APP') {
          emitNotificationEvent({
            uid: n.uid,
            userId: n.userId,
            title: n.title,
            body: n.body,
            type: n.type,
          });
        }
      }
    } catch (err) {
      console.warn(
        '[notifyUsersSafe]',
        err instanceof Error ? err.message : err,
      );
    }
  })();
}
