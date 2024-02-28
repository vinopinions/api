import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  ApiResponseOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import { PageDto } from './page.dto';

export const ApiPaginationResponse = <TModel extends Type<any>>(
  model: TModel,
  options?: ApiResponseOptions | undefined,
) => {
  return applyDecorators(
    ApiExtraModels(PageDto),
    ApiResponse({
      ...options,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
