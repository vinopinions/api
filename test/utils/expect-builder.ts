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
  ratings: ExpectedRatingResponse[];
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
    ratings: ratings
      ? ratings.map(buildExpectedRatingResponse)
      : expect.objectContaining<ExpectedRatingResponse>(
          buildExpectedRatingResponse(),
        ),
    friends: friends
      ? friends.map(buildExpectedUserResponse)
      : expect.objectContaining<ExpectedUserResponseNoRelation>(
          buildExpectedUserResponseNoRelation(),
        ),
  };
};

export type ExpectedUserResponseNoRelation = Omit<
  ExpectedUserResponse,
  'ratings' | 'friends'
>;

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

/**
 * Build an object that matches an expected page response
 *
 * NOTE: if you expect no data to be contained in the page, then you need to set data to an empty array
 *
 * @returns
 */
export const buildExpectedPageResponse = <T>({
  data = undefined,
  meta = undefined,
  buildExpectedResponse,
}: DeepPartial<ExpectedPageResponse<T>> & {
  buildExpectedResponse: (expected?: DeepPartial<T>) => T;
}): ExpectedPageResponse<T> => {
  return {
    data: data
      ? data.map(buildExpectedResponse)
      : expect.arrayContaining<T>([
          expect.objectContaining<T>(buildExpectedResponse()),
        ]),
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
}: DeepPartial<ExpectedFriendRequestResponse> = {}): ExpectedFriendRequestResponse => {
  return {
    id: id ?? expect.any(String),
    receiver: buildExpectedUserResponseNoRelation(receiver),
    sender: buildExpectedUserResponseNoRelation(sender),
    createdAt: createdAt ?? expect.any(String),
  };
};

export type ExpectedRatingResponse = {
  id: string;
  stars: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  wine: ExpectedWineResponseNoRelation;
  user: ExpectedUserResponseNoRelation;
};

export const buildExpectedRatingResponse = ({
  id,
  stars,
  text,
  createdAt,
  updatedAt,
  wine,
  user,
}: DeepPartial<ExpectedRatingResponse> = {}): ExpectedRatingResponse => {
  return {
    id: id ?? expect.any(String),
    stars: stars ?? expect.any(Number),
    text: text ?? expect.any(String),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
    wine: buildExpectedWineResponseNoRelation(wine),
    user: buildExpectedUserResponseNoRelation(user),
  };
};

export type ExpectedStoreResponse = {
  id: string;
  name: string;
  address: string;
  url: string;
  wines: ExpectedWineResponseNoRelation[];
  createdAt: string;
  updatedAt: string;
};

export const buildExpectedStoreResponse = ({
  id,
  name,
  address,
  url,
  wines,
  createdAt,
  updatedAt,
}: DeepPartial<ExpectedStoreResponse> = {}): ExpectedStoreResponse => {
  return {
    id: id ?? expect.any(String),
    name: name ?? expect.any(String),
    address: address ?? expect.any(String),
    url: url ?? expect.any(String),
    wines: wines
      ? wines.map(buildExpectedWineResponseNoRelation)
      : expect.arrayContaining<ExpectedWineResponseNoRelation>([
          expect.objectContaining<ExpectedWineResponseNoRelation>(
            buildExpectedWineResponseNoRelation(),
          ),
        ]),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
  };
};

export type ExpectedStoreResponseNoRelation = Omit<
  ExpectedStoreResponse,
  'wines'
>;

export const buildExpectedStoreResponseNoRelation = ({
  id,
  name,
  address,
  url,
  createdAt,
  updatedAt,
}: DeepPartial<ExpectedStoreResponseNoRelation> = {}): ExpectedStoreResponseNoRelation => {
  return {
    id: id ?? expect.any(String),
    name: name ?? expect.any(String),
    address: address ?? expect.any(String),
    url: url ?? expect.any(String),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
  };
};

export type ExpectedWineResponse = {
  id: string;
  name: string;
  year: number;
  grapeVariety: string;
  heritage: string;
  winemaker: ExpectedWinemakerResponseNoRelation;
  stores: ExpectedStoreResponseNoRelation[];
  ratings: ExpectedRatingResponse[];
  createdAt: string;
  updatedAt: string;
};

export const buildExpectedWineResponse = ({
  id,
  name,
  year,
  grapeVariety,
  heritage,
  winemaker,
  stores,
  ratings,
  createdAt,
  updatedAt,
}: DeepPartial<ExpectedWineResponse> = {}): ExpectedWineResponse => {
  return {
    id: id ?? expect.any(String),
    name: name ?? expect.any(String),
    year: year ?? expect.any(Number),
    grapeVariety: grapeVariety ?? expect.any(String),
    heritage: heritage ?? expect.any(String),
    winemaker: buildExpectedWinemakerResponseNoRelation(winemaker),
    stores: stores
      ? stores.map((store) => buildExpectedStoreResponse(store))
      : expect.objectContaining(buildExpectedStoreResponse()),
    ratings: ratings
      ? ratings.map((rating) => buildExpectedRatingResponse(rating))
      : expect.objectContaining(buildExpectedRatingResponse()),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
  };
};

export type ExpectedWineResponseNoRelation = Omit<
  ExpectedWineResponse,
  'winemaker' | 'stores' | 'ratings'
>;

export const buildExpectedWineResponseNoRelation = ({
  id,
  name,
  year,
  grapeVariety,
  heritage,
  createdAt,
  updatedAt,
}: DeepPartial<ExpectedWineResponseNoRelation> = {}): ExpectedWineResponseNoRelation => {
  return {
    id: id ?? expect.any(String),
    name: name ?? expect.any(String),
    year: year ?? expect.any(Number),
    grapeVariety: grapeVariety ?? expect.any(String),
    heritage: heritage ?? expect.any(String),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
  };
};

export type ExpectedWinemakerResponse = {
  id: string;
  name: string;
  wines: ExpectedWineResponseNoRelation[];
  createdAt: string;
  updatedAt: string;
};

export const buildExpectedWinemakerResponse = ({
  id,
  name,
  wines,
  createdAt,
  updatedAt,
}: DeepPartial<ExpectedWinemakerResponse> = {}): ExpectedWinemakerResponse => {
  return {
    id: id ?? expect.any(String),
    name: name ?? expect.any(String),
    wines: wines
      ? wines.map(buildExpectedWineResponseNoRelation)
      : expect.objectContaining(buildExpectedWineResponseNoRelation()),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
  };
};

export type ExpectedWinemakerResponseNoRelation = Omit<
  ExpectedWinemakerResponse,
  'wines'
>;

export const buildExpectedWinemakerResponseNoRelation = ({
  id,
  name,
  createdAt,
  updatedAt,
}: DeepPartial<ExpectedWinemakerResponseNoRelation> = {}) => {
  return {
    id: id ?? expect.any(String),
    name: name ?? expect.any(String),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
  };
};
