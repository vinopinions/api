import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import request, { Response, Test } from 'supertest';
import TestAgent from 'supertest/lib/agent';
import {
  ExpectedErrorResponseMessageStringNoError,
  buildExpectedErrorResponseMessageArray,
  buildExpectedErrorResponseMessageString,
  buildExpectedErrorResponseMessageStringNoError,
} from '../utils/expect-builder';

export type HttpMethod = Extract<
  keyof TestAgent<Test>,
  'get' | 'post' | 'put' | 'delete'
>;

type ApiConfig = {
  app: INestApplication;
  endpoint: string;
  method: HttpMethod;
};

type RequestConfig = {
  header?: Record<string, string>;
  body?: string | object;
};

type ExceptionConfig = {
  exception: HttpException;
};

export const endpointExistTest = async ({
  app,
  endpoint,
  method,
}: ApiConfig) => {
  const response: Response = await request(app.getHttpServer())[method](
    endpoint,
  );
  expect(response.status).not.toBe(HttpStatus.NOT_FOUND);
};

export const endpointProtectedTest = async ({
  app,
  endpoint,
  method,
}: ApiConfig) =>
  commonExceptionThrownTest({
    app,
    endpoint,
    method,
    exception: new UnauthorizedException(),
  });

export const invalidUUIDTest = async ({
  app,
  endpoint,
  method,
  idParameter,
  header,
  body,
}: ApiConfig & RequestConfig & { idParameter: string }) => {
  await complexExceptionThrownMessageStringTest({
    app,
    method,
    endpoint: endpoint.replace(idParameter, faker.string.alphanumeric(10)),
    header,
    body,
    exception: new BadRequestException(),
  });
};

export const commonExceptionThrownTest = async ({
  app,
  endpoint,
  method,
  header = {},
  exception,
  body,
}: ApiConfig & RequestConfig & ExceptionConfig) => {
  const response: Response = await request(app.getHttpServer())
    [method](endpoint)
    .set(header)
    .send(body);

  expect(response.status).toBe(exception.getStatus());
  expect(response.body).toEqual(
    buildExpectedErrorResponseMessageStringNoError(
      exception.getResponse() as ExpectedErrorResponseMessageStringNoError,
    ),
  );
};

export const complexExceptionThrownMessageStringTest = async ({
  app,
  endpoint,
  method,
  header = {},
  exception,
  body,
  message,
}: ApiConfig & RequestConfig & ExceptionConfig & { message?: string }) => {
  const response: Response = await request(app.getHttpServer())
    [method](endpoint)
    .set(header)
    .send(body);

  const error: string = (
    exception.getResponse() as ExpectedErrorResponseMessageStringNoError
  ).message;

  expect(response.status).toBe(exception.getStatus());
  expect(response.body).toEqual(
    buildExpectedErrorResponseMessageString({
      error,
      message,
      statusCode: exception.getStatus(),
    }),
  );
};

export const complexExceptionThrownMessageArrayTest = async ({
  app,
  endpoint,
  method,
  header = {},
  exception,
  body,
  message,
}: ApiConfig & RequestConfig & ExceptionConfig & { message?: string[] }) => {
  const response: Response = await request(app.getHttpServer())
    [method](endpoint)
    .set(header)
    .send(body);

  const error: string = (
    exception.getResponse() as ExpectedErrorResponseMessageStringNoError
  ).message;

  expect(response.status).toBe(exception.getStatus());
  expect(response.body).toEqual(
    buildExpectedErrorResponseMessageArray({
      error,
      message,
      statusCode: exception.getStatus(),
    }),
  );
};
