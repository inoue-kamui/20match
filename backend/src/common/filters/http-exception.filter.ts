import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AppErrorCode } from '../errors/app-error-code';

type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    path: string;
    timestamp: string;
  };
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response<ErrorResponseBody>>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      this.handleHttpException(exception, request, response);
      return;
    }

    this.handleUnknownException(exception, request, response);
  }

  private handleHttpException(
    exception: HttpException,
    request: Request,
    response: Response<ErrorResponseBody>
  ): void {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const defaultMessage = exception.message || HttpStatus[status];

    const payload: ErrorResponseBody['error'] = {
      code: this.mapStatusToErrorCode(status, exception),
      message: defaultMessage,
      path: request.url,
      timestamp: new Date().toISOString()
    };

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const { message, error, details, ...rest } = exceptionResponse as Record<string, unknown>;
      payload.message = typeof message === 'string' ? message : payload.message;
      payload.details = details ?? rest;

      if (!payload.code && typeof error === 'string') {
        payload.code = error;
      }
    }

    response.status(status).json({ error: payload });
  }

  private handleUnknownException(
    exception: unknown,
    request: Request,
    response: Response<ErrorResponseBody>
  ): void {
    this.logger.error(exception);

    const payload: ErrorResponseBody['error'] = {
      code: AppErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      path: request.url,
      timestamp: new Date().toISOString()
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: payload });
  }

  private mapStatusToErrorCode(status: number, exception: HttpException): AppErrorCode {
    if (exception instanceof BadRequestException) {
      return AppErrorCode.VALIDATION_FAILED;
    }

    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return AppErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return AppErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return AppErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return AppErrorCode.CONFLICT;
      default:
        return AppErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
