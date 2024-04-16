import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  use(req: Request, res: Response, next: () => void) {
    const startTime = new Date().getTime();
    res.on('finish', () => {
      const logObject = this.createRequestLog(req, res, startTime);
      this.rabbitMQService.sendLogMessage(JSON.stringify(logObject));
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
