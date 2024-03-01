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

type ExpectedUserResponse = {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  // TODO: replace with ExpectedRatingResponse[]
  ratings: any[];
  friends: ExpectedUserResponse[];
};

export const buildExpectedUser = ({
  id,
  username,
  createdAt,
  updatedAt,
  ratings,
  friends,
}: {
  id?: string;
  username?: string;
  createdAt?: string;
  updatedAt?: string;
  ratings?: [];
  friends?: [];
} = {}): ExpectedUserResponse => {
  return {
    id: id ?? expect.any(String),
    username: username ?? expect.any(String),
    createdAt: createdAt ?? expect.any(String),
    updatedAt: updatedAt ?? expect.any(String),
    ratings: ratings ?? expect.any(Array),
    friends: friends ?? expect.any(Array),
  };
};
