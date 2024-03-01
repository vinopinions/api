import { DeepPartial } from 'typeorm';

type ExpectedErrorResponse = {
  error: string;
  message: string | string[];
  statusCode: number;
};

export const buildExpectedErrorResponseMessageArray = ({
  error,
  message,
  statusCode,
}: {
  error?: string;
  message?: string[];
  statusCode?: number;
} = {}): ExpectedErrorResponse => {
  return {
    error: error ?? expect.any(String),
    message: message ?? expect.any(Array),
    statusCode: statusCode ?? expect.any(Number),
  };
};

export const buildExpectedErrorResponseMessageArrayNoError = ({
  message,
  statusCode,
}: {
  message?: string[];
  statusCode?: number;
} = {}): Omit<ExpectedErrorResponse, 'error'> => {
  return {
    message: message ?? expect.any(Array),
    statusCode: statusCode ?? expect.any(Number),
  };
};

export const buildExpectedErrorResponseMessageString = ({
  error,
  message,
  statusCode,
}: {
  error?: string;
  message?: string;
  statusCode?: number;
} = {}): ExpectedErrorResponse => {
  return {
    error: error ?? expect.any(String),
    message: message ?? expect.any(String),
    statusCode: statusCode ?? expect.any(Number),
  };
};

export const buildExpectedErrorResponseMessageStringNoError = ({
  message,
  statusCode,
}: {
  message?: string;
  statusCode?: number;
} = {}): Omit<ExpectedErrorResponse, 'error'> => {
  return {
    message: message ?? expect.any(String),
    statusCode: statusCode ?? expect.any(Number),
  };
};

type ExpectedUserResponse = {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  // TODO: replace with ExpectedRatingResponse[]
  ratings: any[];
  friends: ExpectedUserResponse[];
};

export const buildExpectedUserResponse = ({
  id,
  username,
  createdAt,
  updatedAt,
  ratings,
  friends,
}: DeepPartial<ExpectedUserResponse> = {}): ExpectedUserResponse => {
  return {
    id: id ?? expect.any(String),
    username: username ?? expect.any(String),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
    ratings: ratings ?? expect.any(Array),
    friends: friends ?? expect.any(Array),
  };
};

type ExpectedPageResponse<T> = {
  data: T[];
  meta: {
    page: number;
    take: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

export const buildExpectedPageResponse = <T>({
  data,
  meta,
}: DeepPartial<ExpectedPageResponse<T>> & {}): ExpectedPageResponse<T> => {
  return {
    data: data ?? expect.any(Array),
    meta: {
      page: meta?.page ?? expect.any(Number),
      take: meta?.take ?? expect.any(Number),
      itemCount: meta?.itemCount ?? expect.any(Number),
      pageCount: meta?.pageCount ?? expect.any(Number),
      hasPreviousPage: meta?.hasPreviousPage ?? expect.any(Boolean),
      hasNextPage: meta?.hasNextPage ?? expect.any(Boolean),
    },
  };
};
