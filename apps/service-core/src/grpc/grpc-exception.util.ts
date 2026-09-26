import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';

export function toRpcException(error: unknown): RpcException {
  if (error instanceof RpcException) {
    return error;
  }

  if (error instanceof NotFoundException) {
    return new RpcException({
      code: GrpcStatus.NOT_FOUND,
      message: error.message,
    });
  }

  if (error instanceof ConflictException) {
    return new RpcException({
      code: GrpcStatus.ALREADY_EXISTS,
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedException) {
    return new RpcException({
      code: GrpcStatus.UNAUTHENTICATED,
      message: error.message,
    });
  }

  if (error instanceof ForbiddenException) {
    return new RpcException({
      code: GrpcStatus.PERMISSION_DENIED,
      message: error.message,
    });
  }

  if (error instanceof HttpException) {
    return new RpcException({
      code: GrpcStatus.INVALID_ARGUMENT,
      message: error.message,
    });
  }

  const message =
    error instanceof Error ? error.message : 'Internal server error';
  return new RpcException({
    code: GrpcStatus.INTERNAL,
    message,
  });
}

export function dateToString(value?: Date | string | null): string {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}
