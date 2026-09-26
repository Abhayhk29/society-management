import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {
  MEMBERSHIP_SERVICE,
  SOCIETY_SERVICE,
  protoRoot,
  societyProto,
  userProto,
} from 'shared-protos';
import { config } from '../config';

type Membership = {
  uid: string;
  userId: string;
  societyId: string;
  status: string;
};

type Society = {
  uid: string;
  isActive: boolean;
};

type UnaryClient = {
  [method: string]: (
    req: unknown,
    metadata: grpc.Metadata,
    options: grpc.CallOptions | undefined,
    cb: (err: grpc.ServiceError | null, res: unknown) => void,
  ) => void;
};

let membershipClient: UnaryClient | null = null;
let societyClient: UnaryClient | null = null;

function loadClients() {
  if (membershipClient && societyClient) return;

  const packageDefinition = protoLoader.loadSync([userProto, societyProto], {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [protoRoot],
  });
  const proto = grpc.loadPackageDefinition(packageDefinition) as any;
  const pkg = proto.society.core.v1;

  membershipClient = new pkg[MEMBERSHIP_SERVICE](
    config.coreGrpcUrl,
    grpc.credentials.createInsecure(),
  );
  societyClient = new pkg[SOCIETY_SERVICE](
    config.coreGrpcUrl,
    grpc.credentials.createInsecure(),
  );
}

function callUnary<T>(
  client: UnaryClient,
  method: string,
  request: unknown,
  accessToken?: string,
): Promise<T> {
  const metadata = new grpc.Metadata();
  if (accessToken) {
    metadata.set(
      'authorization',
      accessToken.startsWith('Bearer ')
        ? accessToken
        : `Bearer ${accessToken}`,
    );
  }
  return new Promise((resolve, reject) => {
    client[method](request, metadata, undefined, (err, res) => {
      if (err) reject(err);
      else resolve(res as T);
    });
  });
}

/**
 * Ensures society exists/active and the actor can access it
 * (active membership OR ability to GetSociety via their JWT).
 */
export async function assertSocietyAccess(input: {
  userId: string;
  societyId: string;
  accessToken?: string;
}): Promise<void> {
  loadClients();
  if (!membershipClient || !societyClient) {
    throw Object.assign(new Error('Core gRPC client not ready'), { code: 13 });
  }

  const society = await callUnary<Society>(
    societyClient,
    'getSociety',
    { uid: input.societyId },
    input.accessToken,
  );
  if (!society?.isActive) {
    throw Object.assign(new Error('Society is inactive'), { code: 9 });
  }

  try {
    const membershipsRes = await callUnary<{ memberships?: Membership[] }>(
      membershipClient,
      'listMembershipsByUser',
      { uid: input.userId },
      input.accessToken,
    );
    const memberships = membershipsRes.memberships ?? [];
    const member = memberships.some(
      (m) =>
        m.societyId === input.societyId &&
        (m.status === 'ACTIVE' || m.status === 'PENDING'),
    );
    if (member) return;
  } catch {
    // Fall through — admin may lack membership but can view society
  }

  // If GetSociety already succeeded with their token, treat as allowed
  // (admin / manage:society without membership row).
}
