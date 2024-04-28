import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { REDIS_CLIENT_TOKEN } from '../redis/redis.module';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(@Inject(REDIS_CLIENT_TOKEN) private redisClient: ClientProxy) {}

  use(req: Request, res: Response, next: () => void) {
    const startTime = new Date().getTime();
    res.on('finish', () => {
      this.redisClient.emit('log', this.createRequestLog(req, res, startTime));
    });
    next();
  }

  private createRequestLog(
    req: Request,
    res: Response,
    responseTime: number,
    level = 'info',
  ) {
    const timestamp = new Date().toISOString();
    const request = {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers['user-agent'],
      clientIP: req.ip,
    };
    const response = {
      statusCode: res.statusCode,
      headers: res.getHeaders(),
      bodySize: res.getHeader('content-length') || 0,
    };

    return {
      timestamp,
      level,
      responseTime,
      request: request,
      response: response,
    };
  }
}
