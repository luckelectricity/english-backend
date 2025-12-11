import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse, ResponseCode, ResponseMessage } from '../interfaces/api-response.interface';

/**
 * 全局异常过滤器
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    /**
     * 将 HttpStatus 映射到 ResponseCode
     */
    private mapHttpStatusToResponseCode(status: HttpStatus): ResponseCode {
        switch (status) {
            case HttpStatus.OK:
                return ResponseCode.SUCCESS;
            case HttpStatus.CREATED:
                return ResponseCode.CREATED;
            case HttpStatus.BAD_REQUEST:
                return ResponseCode.BAD_REQUEST;
            case HttpStatus.UNAUTHORIZED:
                return ResponseCode.UNAUTHORIZED;
            case HttpStatus.FORBIDDEN:
                return ResponseCode.FORBIDDEN;
            case HttpStatus.NOT_FOUND:
                return ResponseCode.NOT_FOUND;
            default:
                return ResponseCode.INTERNAL_ERROR;
        }
    }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = ResponseMessage.INTERNAL_ERROR;
        let code: number = ResponseCode.INTERNAL_ERROR;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || exception.message;
                // 如果是数组（验证错误），取第一个
                if (Array.isArray(message)) {
                    message = message[0];
                }
            }

            // 根据 HTTP 状态码设置响应码
            code = this.mapHttpStatusToResponseCode(status);
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        // 记录错误日志
        this.logger.error(
            `${request.method} ${request.url} - ${status} - ${message}`,
            exception instanceof Error ? exception.stack : '',
        );

        const errorResponse: ApiResponse = {
            code,
            message,
            data: null,
        };

        response.status(status).json(errorResponse);
    }
}
