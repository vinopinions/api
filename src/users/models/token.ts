import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

const EXPONENT_PUSH_TOKEN_REGEX = /^ExponentPushToken\[.+\]$/;
const EXPONENT_PUSH_TOKEN_PATTERN =
  EXPONENT_PUSH_TOKEN_REGEX.toString().substring(
    1,
    EXPONENT_PUSH_TOKEN_REGEX.toString().length - 1,
  );

class Token {
  @ApiProperty({
    example: 'ExponentPushToken[abc]',
    description: 'push token to register',
    type: String,
    pattern: EXPONENT_PUSH_TOKEN_PATTERN,
  })
  @Matches(EXPONENT_PUSH_TOKEN_REGEX)
  token: string;
}

export default Token;
