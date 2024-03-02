import { DeepPartial } from 'typeorm';

export type ExpectedErrorResponseMessageArray = {
  error: string;
  message: string[];
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
} = {}): ExpectedErrorResponseMessageArray => {
  return {
    error: error ?? expect.any(String),
    message: message ?? expect.any(Array),
    statusCode: statusCode ?? expect.any(Number),
  };
};

export type ExpectedErrorResponseMessageArrayNoError = Omit<
  ExpectedErrorResponseMessageArray,
  'error'
>;

export const buildExpectedErrorResponseMessageArrayNoError = ({
  message,
  statusCode,
}: {
  message?: string[];
  statusCode?: number;
} = {}): ExpectedErrorResponseMessageArrayNoError => {
  return {
    message: message ?? expect.any(Array),
    statusCode: statusCode ?? expect.any(Number),
  };
};

export type ExpectedErrorResponseMessageString = {
  error: string;
  message: string;
  statusCode: number;
};

export const buildExpectedErrorResponseMessageString = ({
  error,
  message,
  statusCode,
}: {
  error?: string;
  message?: string;
  statusCode?: number;
} = {}): ExpectedErrorResponseMessageString => {
  return {
    error: error ?? expect.any(String),
    message: message ?? expect.any(String),
    statusCode: statusCode ?? expect.any(Number),
  };
};

export type ExpectedErrorResponseMessageStringNoError = Omit<
  ExpectedErrorResponseMessageString,
  'error'
>;

export const buildExpectedErrorResponseMessageStringNoError = ({
  message,
  statusCode,
}: {
  message?: string;
  statusCode?: number;
} = {}): ExpectedErrorResponseMessageStringNoError => {
  return {
    message: message ?? expect.any(String),
    statusCode: statusCode ?? expect.any(Number),
  };
};

export type ExpectedUserResponse = {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  // TODO: replace with ExpectedRatingResponse[]
  ratings: any[];
  friends: ExpectedUserResponse[];
};

export type ExpectedUserResponseNoRelation = {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
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

export const buildExpectedUserResponseNoRelation = ({
  id,
  username,
  createdAt,
  updatedAt,
}: DeepPartial<ExpectedUserResponseNoRelation> = {}): ExpectedUserResponseNoRelation => {
  return {
    id: id ?? expect.any(String),
    username: username ?? expect.any(String),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
  };
};

export type ExpectedPageResponse<T> = {
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

export type ExpectedFriendRequestResponse = {
  id: string;
  receiver: ExpectedUserResponseNoRelation;
  sender: ExpectedUserResponseNoRelation;
  createdAt: string;
};

export const buildExpectedFriendRequestResponse = ({
  id,
  receiver,
  sender,
  createdAt,
}: DeepPartial<ExpectedFriendRequestResponse>): ExpectedFriendRequestResponse => {
  return {
    id: id ?? expect.any(String),
    receiver: buildExpectedUserResponseNoRelation(receiver),
    sender: buildExpectedUserResponseNoRelation(sender),
    createdAt: createdAt ?? expect.any(String),
  };
};
