import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 信任代理 (Cloudflare + Nginx)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe());

  // 设置全局路由前缀
  app.setGlobalPrefix('api');

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 启用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 应用启动成功,端口: ${port}`);
  logger.log(`📝 API 文档: http://localhost:${port}`);
  logger.log(`🔍 健康检查: http://localhost:${port}/api/health`);
}
bootstrap();
