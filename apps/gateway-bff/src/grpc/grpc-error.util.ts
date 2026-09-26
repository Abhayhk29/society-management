import {
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { status as GrpcStatus } from '@grpc/grpc-js';

export function mapGrpcError(error: unknown): never {
  const err = error as { code?: number; details?: string; message?: string };
  const message = err.details || err.message || 'Upstream gRPC error';

  switch (err.code) {
    case GrpcStatus.NOT_FOUND:
      throw new NotFoundException(message);
    case GrpcStatus.ALREADY_EXISTS:
      throw new ConflictException(message);
    case GrpcStatus.INVALID_ARGUMENT:
      throw new BadRequestException(message);
    case GrpcStatus.UNAUTHENTICATED:
      throw new UnauthorizedException(message);
    case GrpcStatus.PERMISSION_DENIED:
      throw new ForbiddenException(message);
    default:
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(message);
  }
}
