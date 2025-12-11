import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ResponseCode, ResponseMessage } from '../interfaces/api-response.interface';

/**
 * 统一响应格式拦截器
 */
@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((data) => {
                // 如果返回的数据已经是 ApiResponse 格式，直接返回
                if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
                    return data as ApiResponse<T>;
                }

                // 否则包装成统一格式
                return {
                    code: ResponseCode.SUCCESS,
                    message: ResponseMessage.SUCCESS,
                    data: data ?? null,
                };
            }),
        );
    }
}
